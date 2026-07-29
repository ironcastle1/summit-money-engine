const { ageLabel, distanceMiles, clamp } = require('./util');
const { OPPORTUNITY_CATEGORIES, MONEY_BACK_TARGETS } = require('./sourcePlan');

function rankNews(item) {
  let score = item.trustScore || 30;
  if (['market-moving', 'policy', 'movement', 'security', 'conflict'].includes(item.category)) score += 18;
  if (item.place) score += 10;
  if (/supply|disruption|shortage|sanction|tariff|regulation|border|strike|airport|shipping|oil|gas|gold|copper|wheat|crypto|AI|automation/i.test(`${item.title} ${item.description}`)) score += 15;
  if (/latest|update|breaking|new|raises|cuts|halts|warns|bans|launches|opens|closes/i.test(item.title)) score += 7;
  return clamp(score, 0, 100) || 0;
}

function actionSteps(item) {
  const s = `${item.title} ${item.description}`.toLowerCase();
  const steps = [];
  if (/oil|gas|gold|silver|copper|wheat|corn|shipping|suez|hormuz|port|supply/.test(s)) {
    steps.push('Check related commodities, shipping firms, exporters/importers, and businesses exposed to the change.');
    steps.push('Write a 5-point plain-English summary before most people understand the knock-on effect.');
  }
  if (/sanction|tariff|regulation|visa|tax|law|policy/.test(s)) {
    steps.push('Build a simple checklist for affected businesses or travellers.');
    steps.push('Search LinkedIn/Google Maps for companies exposed to the change and create a lead list.');
  }
  if (/airport|border|strike|route|travel|protest|security/.test(s)) {
    steps.push('Create a local travel/security brief for affected routes or cities.');
    steps.push('Offer a paid route check or arrival checklist to travellers/expats.');
  }
  if (/remote|freelance|automation|ai|startup|business/.test(s)) {
    steps.push('Turn this into a small service offer: research, automation, monitoring, mapping or report writing.');
  }
  if (!steps.length) steps.push('Look for who needs this explained quickly, then package it as a short paid briefing or lead list.' );
  return steps.slice(0, 3);
}

function opportunityFromNews(item) {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    score: rankNews(item),
    source: item.domain || item.sourceSystem,
    sourceSystem: item.sourceSystem,
    date: item.pubDate,
    age: ageLabel(item.pubDate),
    link: item.link,
    place: item.place,
    whyItMatters: item.opportunity,
    actions: actionSteps(item),
    confidence: item.trustScore >= 75 ? 'High source confidence' : item.trustScore >= 55 ? 'Medium source confidence' : 'Check source before acting',
    subscriptionAngle: 'Potential route to recover the £20/month subscription if turned into a brief, lead list, content asset or service pitch.'
  };
}

function buildMorningBrief(news, markets) {
  const opportunities = news.map(opportunityFromNews).sort((a, b) => b.score - a.score).slice(0, 10);
  const movers = (markets || []).filter(m => Number.isFinite(Number(m.changePct))).slice(0, 12);
  const categories = {};
  for (const n of news) categories[n.category] = (categories[n.category] || 0) + 1;
  return {
    title: 'Today’s information edge',
    generatedAt: new Date().toISOString(),
    summary: [
      `${opportunities.length} strong information opportunities found from public sources.`,
      `${movers.length} market rows loaded.`,
      `${Object.entries(categories).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v]) => `${k}: ${v}`).join(' | ') || 'No category totals yet'}`
    ],
    opportunities,
    marketMovers: movers,
    whatToDoFirst: opportunities.slice(0, 3).map(o => ({ title: o.title, action: o.actions[0], source: o.source, link: o.link })),
    moneyBackTargets: MONEY_BACK_TARGETS
  };
}

function buildTrendStreams(news) {
  const groups = new Map();
  for (const n of news) {
    const key = n.category || 'general';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(opportunityFromNews(n));
  }
  return [...groups.entries()].map(([category, items]) => ({
    category,
    count: items.length,
    topScore: Math.max(...items.map(i => i.score)),
    items: items.sort((a, b) => b.score - a.score).slice(0, 10)
  })).sort((a, b) => b.topScore - a.topScore);
}

function buildAreaIdeas(scan) {
  const place = scan.place && (scan.place.displayName || scan.place.name || scan.place.city) || 'selected area';
  const ideas = [];
  ideas.push({
    name: 'Local intelligence brief',
    value: `Create a one-page “what to know before visiting ${place}” briefing.`,
    buyer: 'travellers, expats, small businesses, relatives of people in the area',
    action: 'Use the scan results, infrastructure, routes and live signals as the source material.'
  });
  ideas.push({
    name: 'Arrival checklist',
    value: `Turn the radius scan into a practical arrival checklist for ${place}.`,
    buyer: 'people arriving by plane, road or border crossing',
    action: 'Include nearest hospital, pharmacy, police, fuel, station, and current disruptions.'
  });
  if ((scan.eventsInside || []).length) {
    ideas.push({
      name: 'Event impact note',
      value: 'Package nearby events into a plain-English impact note.',
      buyer: 'niche communities, businesses, traders, local watchers',
      action: 'Summarise what changed, who is affected, and what to monitor next.'
    });
  }
  ideas.push({
    name: 'Lead list angle',
    value: 'Find businesses exposed to the local issue and pitch a small service.',
    buyer: 'hotels, logistics firms, importers/exporters, tour operators, local services',
    action: 'Offer route updates, source monitoring, local risk summaries or competitor monitoring.'
  });
  return ideas;
}

const { baselineFor } = require('./countryRisk');

function scoreArea(scan) {
  const events = scan.eventsInside || [];
  const infra = scan.infrastructure || [];
  const crime = scan.localCrime || {};
  const baseline = baselineFor(scan.place && scan.place.country);
  let unsafe = Math.max(18, Math.round((baseline.risk || 22) * 0.65));
  let safe = 100 - unsafe;
  if (events.some(e => ['conflict','security'].includes(e.category))) unsafe += 20;
  if (events.some(e => e.category === 'crisis')) unsafe += 12;
  if (crime.available && crime.total > 60) unsafe += 15;
  if (crime.available && crime.total > 120) unsafe += 15;
  if (infra.some(i => ['hospital','clinic','pharmacy','police'].includes(i.kind))) safe += 5;
  if (!infra.length) unsafe += 5;
  unsafe = clamp(unsafe, 8, 84) || 25;
  safe = 100 - unsafe;
  return {
    safePct: Math.round(safe),
    riskPct: Math.round(unsafe),
    verdict: unsafe >= 55 ? 'High caution' : unsafe >= 35 ? 'Caution' : 'Generally clear',
    basis: `${baseline.reason}; public sources, nearby event signals, local crime where available, and mapped infrastructure`
  };
}

module.exports = {
  opportunityFromNews,
  buildMorningBrief,
  buildTrendStreams,
  buildAreaIdeas,
  scoreArea,
  OPPORTUNITY_CATEGORIES
};
