const STOP_WORDS = new Set([
  'the','a','an','and','or','but','if','then','else','when','where','who','what','why','how','to','of','in','on','at','by','for','from','with','without','into','over','under','after','before','between','through','during','about','against','as','is','are','was','were','be','been','being','it','its','this','that','these','those','they','their','them','he','his','she','her','we','our','you','your','i','me','my','says','said','say','new','latest','live','update','updates','breaking'
]);

const COUNTRY_ALIASES = Object.freeze({
  'united states': 'US', 'u.s.': 'US', 'usa': 'US', 'america': 'US',
  'united kingdom': 'GB', 'u.k.': 'GB', 'britain': 'GB', 'england': 'GB',
  'russia': 'RU', 'russian federation': 'RU', 'ukraine': 'UA', 'china': 'CN',
  'taiwan': 'TW', 'iran': 'IR', 'israel': 'IL', 'gaza': 'PS', 'palestine': 'PS',
  'saudi arabia': 'SA', 'united arab emirates': 'AE', 'uae': 'AE',
  'india': 'IN', 'pakistan': 'PK', 'japan': 'JP', 'south korea': 'KR',
  'north korea': 'KP', 'france': 'FR', 'germany': 'DE', 'italy': 'IT',
  'spain': 'ES', 'turkey': 'TR', 'syria': 'SY', 'iraq': 'IQ', 'yemen': 'YE',
  'lebanon': 'LB', 'jordan': 'JO', 'egypt': 'EG', 'libya': 'LY', 'sudan': 'SD',
  'venezuela': 'VE', 'brazil': 'BR', 'argentina': 'AR', 'mexico': 'MX',
  'canada': 'CA', 'australia': 'AU', 'new zealand': 'NZ', 'south africa': 'ZA'
});

const CATEGORY_RULES = Object.freeze([
  ['conflict', /\b(conflict|war|attack|airstrike|missile|troops?|military|invasion|shelling|ceasefire|armed forces?|battle|drone strike|bombing)\b/i],
  ['terror', /\b(terror|terrorist|bomb attack|suicide bombing|hostage|extremist|militant attack)\b/i],
  ['protest', /\b(protest|demonstration|riot|civil unrest|strike action|rally|marchers?)\b/i],
  ['crime', /\b(murder|homicide|shooting|robbery|fraud|arrested|police raid|kidnap|cartel|organised crime)\b/i],
  ['earthquake', /\b(earthquake|tremor|aftershock|seismic)\b/i],
  ['volcano', /\b(volcano|eruption|lava|volcanic ash)\b/i],
  ['wildfire', /\b(wildfire|forest fire|bushfire|fire crews?)\b/i],
  ['storm', /\b(hurricane|typhoon|cyclone|storm|tornado|high winds?)\b/i],
  ['flood', /\b(flood|flash flooding|inundation|river burst)\b/i],
  ['drought', /\b(drought|water shortage|reservoir levels?)\b/i],
  ['landslide', /\b(landslide|mudslide|rockfall|avalanche)\b/i],
  ['health', /\b(outbreak|epidemic|pandemic|virus|disease|hospital admissions?|health emergency)\b/i],
  ['energy', /\b(oil|gas|pipeline|refinery|electricity|power grid|energy prices?|nuclear plant|lng)\b/i],
  ['transport', /\b(shipping|port|rail|airport|airline|road closure|freight|cargo|vessel|tanker)\b/i],
  ['infrastructure', /\b(bridge|dam|internet outage|telecom|infrastructure|power outage|blackout|subsea cable)\b/i],
  ['economic', /\b(inflation|interest rate|central bank|recession|gdp|tariff|sanctions|currency|stock market|bond yields?|unemployment|earnings)\b/i],
  ['cyber', /\b(cyber|ransomware|data breach|hackers?|malware|ddos|zero-day)\b/i],
  ['election', /\b(election|votes?|ballot|polling station|parliament|presidential race|referendum|coalition)\b/i]
]);

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[^a-zA-Z0-9£$€%+\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function tokens(value, options = {}) {
  const minimumLength = options.minimumLength ?? 3;
  return normalizeText(value).split(' ').filter(token => token.length >= minimumLength && !STOP_WORDS.has(token));
}

export function tokenSet(value, options) {
  return new Set(tokens(value, options));
}

export function jaccardSimilarity(left, right) {
  const a = left instanceof Set ? left : tokenSet(left);
  const b = right instanceof Set ? right : tokenSet(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

export function cosineSimilarity(left, right) {
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  if (!leftTokens.length || !rightTokens.length) return 0;
  const frequencies = values => {
    const map = new Map();
    for (const value of values) map.set(value, (map.get(value) || 0) + 1);
    return map;
  };
  const a = frequencies(leftTokens);
  const b = frequencies(rightTokens);
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (const value of a.values()) magnitudeA += value * value;
  for (const value of b.values()) magnitudeB += value * value;
  for (const [token, value] of a) dot += value * (b.get(token) || 0);
  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB) || 1);
}

export function classifyText(value) {
  const text = String(value || '');
  const match = CATEGORY_RULES.find(([, pattern]) => pattern.test(text));
  return match ? match[0] : 'other';
}

export function extractCountries(value) {
  const normalized = normalizeText(value);
  const results = [];
  for (const [name, code] of Object.entries(COUNTRY_ALIASES)) {
    if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(normalized)) results.push(code);
  }
  return [...new Set(results)];
}

export function extractTickers(value) {
  const text = String(value || '');
  const cashtags = [...text.matchAll(/\$([A-Z]{2,8})\b/g)].map(match => match[1]);
  const known = [
    ['bitcoin', 'BTC'], ['btc', 'BTC'], ['ethereum', 'ETH'], ['ether', 'ETH'], ['solana', 'SOL'],
    ['gold', 'XAU'], ['silver', 'XAG'], ['brent', 'BRENT'], ['crude oil', 'WTI'], ['natural gas', 'NG'],
    ['s&p 500', 'SPX'], ['nasdaq', 'NDX'], ['ftse', 'FTSE'], ['dow jones', 'DJI'], ['dollar', 'DXY'],
    ['tesla', 'TSLA'], ['apple', 'AAPL'], ['microsoft', 'MSFT'], ['nvidia', 'NVDA'], ['amazon', 'AMZN'],
    ['meta', 'META'], ['alphabet', 'GOOGL'], ['boeing', 'BA'], ['lockheed', 'LMT'], ['palantir', 'PLTR']
  ];
  const normalized = normalizeText(text);
  const aliases = known.filter(([name]) => normalized.includes(name)).map(([, symbol]) => symbol);
  return [...new Set([...cashtags, ...aliases])];
}

export function extractEntities(value) {
  const text = String(value || '');
  const capitalized = [...text.matchAll(/\b(?:[A-Z][a-z]{2,}|[A-Z]{2,})(?:\s+(?:[A-Z][a-z]{2,}|[A-Z]{2,})){0,3}\b/g)]
    .map(match => match[0].trim())
    .filter(name => !/^(The|This|That|Breaking|Live|New|Latest|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(name));
  const frequency = new Map();
  for (const entity of capitalized) frequency.set(entity, (frequency.get(entity) || 0) + 1);
  return [...frequency.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, 20).map(([entity]) => entity);
}

export function queryTerms(value, limit = 12) {
  const frequency = new Map();
  for (const token of tokens(value)) frequency.set(token, (frequency.get(token) || 0) + 1);
  return [...frequency.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, limit).map(([token]) => token);
}
