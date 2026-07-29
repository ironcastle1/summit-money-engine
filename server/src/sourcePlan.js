const NEWS_SOURCE_GROUPS = [
  {
    id: 'market-moving',
    label: 'Market-moving events',
    queries: [
      'oil supply disruption OR refinery fire OR pipeline attack OR OPEC',
      'gold price moves OR central bank gold OR sanctions gold',
      'copper supply disruption OR mine strike OR China copper demand',
      'wheat export disruption OR grain corridor OR drought wheat',
      'shipping disruption OR Red Sea shipping OR Suez Canal OR Strait of Hormuz',
      'semiconductor export controls OR chip supply chain',
      'uranium supply OR nuclear fuel OR uranium mine',
      'LNG supply disruption OR gas pipeline outage',
      'fertilizer supply disruption OR potash sanctions',
      'coffee crop shortage OR cocoa shortage OR sugar shortage'
    ]
  },
  {
    id: 'online-opportunity',
    label: 'Online opportunity leads',
    queries: [
      'remote freelance work AI automation demand',
      'businesses need cybersecurity services small business',
      'travel safety demand digital nomads expats',
      'supply chain disruption businesses seeking alternatives',
      'new AI tools for small business marketing automation',
      'newsletter niche market opportunity geopolitical intelligence',
      'local lead generation opportunity small business services',
      'cross border ecommerce demand emerging market',
      'digital products templates business opportunity',
      'data dashboard SaaS opportunity small business'
    ]
  },
  {
    id: 'security-travel',
    label: 'Travel and safety',
    queries: [
      'travel warning airport disruption border closure strike protest Europe',
      'Syria security Damascus Aleppo Latakia Homs latest',
      'Lebanon travel security airport border latest',
      'Jordan Syria border crossing latest security',
      'Israel Palestine travel security latest',
      'Turkey earthquake protest travel security latest',
      'Europe protest strike transport disruption latest',
      'airport disruption Europe Middle East latest',
      'visa border disruption travellers latest',
      'civil unrest travel advisory latest'
    ]
  },
  {
    id: 'policy-regulation',
    label: 'Policy and regulation',
    queries: [
      'new crypto regulation exchange restrictions latest',
      'AI regulation businesses compliance opportunity latest',
      'sanctions new restrictions business latest',
      'trade tariffs import export restrictions latest',
      'data privacy regulation small business compliance latest',
      'tax change digital nomad remote work latest',
      'visa rules changed remote workers digital nomads latest',
      'energy policy change commodity markets latest',
      'election policy risk markets latest',
      'central bank rates inflation policy latest'
    ]
  }
];

const EXCLUDED_DOMAINS = [
  'theguardian.com', 'dailymail.co.uk', 'thesun.co.uk', 'mirror.co.uk', 'metro.co.uk',
  'buzzfeed.com', 'tmz.com', 'people.com', 'marca.com', 'goal.com', 'sportbible.com',
  'foxnews.com/entertainment', 'reddit.com', 'tiktok.com', 'x.com', 'twitter.com'
];

const JUNK_TERMS = [
  'celebrity', 'tate brothers', 'andrew tate', 'barron trump', 'football transfer',
  'premier league', 'tennis star', 'uniforms', 'commonwealth games', 'movie trailer',
  'horoscope', 'lottery', 'gossip', 'fashion', 'royal family feud', 'bitcoin giveaway'
];

const TRUSTED_DOMAINS = [
  'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'aljazeera.com', 'ft.com',
  'bloomberg.com', 'cnbc.com', 'marketwatch.com', 'investing.com', 'reliefweb.int',
  'gdacs.org', 'usgs.gov', 'gov.uk', 'travel.state.gov', 'ecb.europa.eu',
  'worldbank.org', 'data.police.uk', 'openstreetmap.org', 'wikipedia.org'
];

const OPPORTUNITY_CATEGORIES = [
  { id: 'market-watch', label: 'Market watch', value: 'Use the event to decide what assets deserve research today.' },
  { id: 'content-brief', label: 'Paid content brief', value: 'Turn a complex event into a short paid briefing, thread, email or client note.' },
  { id: 'lead-list', label: 'Lead list', value: 'Find affected businesses and offer a service tied to the event.' },
  { id: 'local-intel', label: 'Local intelligence', value: 'Create city or route intelligence for travellers, families or businesses.' },
  { id: 'arbitrage', label: 'Information arbitrage', value: 'Spot a mismatch between what happened and what ordinary people/businesses have noticed.' },
  { id: 'freelance-service', label: 'Freelance service', value: 'Use the event to pitch research, automation, translation, mapping or monitoring work.' },
  { id: 'digital-product', label: 'Digital product', value: 'Build a template/checklist/map/report from repeated demand.' }
];

const MONEY_BACK_TARGETS = [
  { label: '£20/month target', method: 'Sell one short local/travel briefing, one spreadsheet, one lead list, or one consulting note.' },
  { label: '£50/month target', method: 'Sell two to three specialised briefs or one small business lead/research job.' },
  { label: '£200/month target', method: 'Run a recurring niche brief: routes, sanctions, commodity disruptions, expat safety, or local market leads.' }
];

module.exports = {
  NEWS_SOURCE_GROUPS,
  EXCLUDED_DOMAINS,
  JUNK_TERMS,
  TRUSTED_DOMAINS,
  OPPORTUNITY_CATEGORIES,
  MONEY_BACK_TARGETS
};
