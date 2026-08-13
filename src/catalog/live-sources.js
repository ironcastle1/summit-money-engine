import { collectionStreams, gdeltQueryFor } from './collection-plans.js';

export const DIRECT_SOURCES = Object.freeze([
  { id:'bbc-world', lane:'reporting', name:'BBC World RSS', kind:'rss', url:'https://feeds.bbci.co.uk/news/world/rss.xml', type:'publisher', quality:0.90 },
  { id:'bbc-business', lane:'reporting', name:'BBC Business RSS', kind:'rss', url:'https://feeds.bbci.co.uk/news/business/rss.xml', type:'publisher', quality:0.90 },
  { id:'un-news', lane:'humanitarian', name:'UN News RSS', kind:'rss', url:'https://news.un.org/feed/subscribe/en/news/all/rss.xml', type:'official', quality:1.00 },
  { id:'ecb-press', lane:'markets', name:'ECB Press RSS', kind:'rss', url:'https://www.ecb.europa.eu/rss/press.html', type:'official', quality:1.00, regionId:'europe' },
  { id:'fcdo', lane:'policy', name:'UK FCDO Atom', kind:'rss', url:'https://www.gov.uk/government/organisations/foreign-commonwealth-development-office.atom', type:'official', quality:1.00, regionId:'europe' },
  { id:'fed-monetary', lane:'markets', name:'Federal Reserve Monetary Policy RSS', kind:'rss', url:'https://www.federalreserve.gov/feeds/press_monetary.xml', type:'official', quality:1.00, regionId:'north-america' },

  { id:'ofac-actions', lane:'sanctions', name:'OFAC Recent Actions', kind:'official-page', url:'https://ofac.treasury.gov/recent-actions', includePath:'/recent-actions/', type:'official', quality:1.00, regionId:'north-america' },
  { id:'treasury-releases', lane:'sanctions', name:'U.S. Treasury Press Releases', kind:'official-page', url:'https://home.treasury.gov/news/press-releases', includePath:'/news/press-releases/', type:'official', quality:1.00, regionId:'north-america' },
  { id:'whitehouse-briefings', lane:'policy', name:'White House Briefings & Statements', kind:'official-page', url:'https://www.whitehouse.gov/briefings-statements/', includePath:'/briefings-statements/', type:'official', quality:1.00, regionId:'north-america' },
  { id:'state-releases', lane:'policy', name:'U.S. State Department Releases', kind:'official-page', url:'https://www.state.gov/press-releases/', includePath:'/releases/', type:'official', quality:1.00, regionId:'north-america' },
  { id:'dod-releases', lane:'defense', name:'U.S. Defense Department Releases', kind:'official-page', url:'https://www.defense.gov/News/Releases/', includePath:'/News/Releases/Release/', type:'official', quality:1.00, regionId:'north-america' },
  { id:'eu-council', lane:'policy', name:'Council of the EU Press Releases', kind:'official-page', url:'https://www.consilium.europa.eu/en/press/press-releases/', includePath:'/press/press-releases/', type:'official', quality:1.00, regionId:'europe' },
  { id:'nato-news', lane:'defense', name:'NATO News', kind:'official-page', url:'https://www.nato.int/en/news-and-events', includePath:'/news-and-events/', type:'official', quality:1.00, regionId:'europe' },
  { id:'kremlin-news', lane:'policy', name:'Kremlin Presidential News', kind:'official-page', url:'https://en.kremlin.ru/events/president/news', includePath:'/events/president/news/', type:'official', quality:0.80, regionId:'russia-eurasia' },
  { id:'russia-mfa', lane:'policy', name:'Russian Foreign Ministry News', kind:'official-page', url:'https://mid.ru/en/foreign_policy/news/', includePath:'/foreign_policy/news/', type:'official', quality:0.78, regionId:'russia-eurasia' },
  { id:'iaea-news', lane:'nuclear', name:'IAEA News', kind:'official-page', url:'https://www.iaea.org/newscenter/news', includePath:'/newscenter/', type:'official', quality:1.00, regionId:'middle-east' },
  { id:'japan-mofa', lane:'policy', name:'Japan Foreign Ministry Releases', kind:'official-page', url:'https://www.mofa.go.jp/press/release/index.html', includePath:'/press/release/', type:'official', quality:1.00, regionId:'strategic-asia' },

  { id:'usgs-significant', lane:'humanitarian', name:'USGS Significant Earthquakes', kind:'usgs', url:'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson', type:'official', quality:1.00 },
  { id:'reliefweb', lane:'humanitarian', name:'ReliefWeb Reports', kind:'reliefweb', url:'https://api.reliefweb.int/v2/reports', type:'official', quality:0.96 },
  { id:'polymarket', lane:'markets', name:'Polymarket Events', kind:'polymarket', url:'https://gamma-api.polymarket.com/events?active=true&closed=false&limit=100', type:'prediction', quality:0.74 },
  { id:'coingecko', lane:'markets', name:'CoinGecko', kind:'crypto', url:'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true', type:'market', quality:0.90 },
  { id:'coinbase-fx', lane:'markets', name:'Coinbase FX', kind:'fx', url:'https://api.coinbase.com/v2/exchange-rates?currency=USD', type:'market', quality:0.90 },
  { id:'stooq-brent', lane:'markets', name:'Stooq Brent', kind:'stooq', url:'https://stooq.com/q/l/?s=brent.f&i=d', symbol:'BRENT', type:'market', quality:0.78 },
  { id:'stooq-gold', lane:'markets', name:'Stooq Gold', kind:'stooq', url:'https://stooq.com/q/l/?s=xauusd&i=d', symbol:'XAUUSD', type:'market', quality:0.78 },

  // Defence and force-posture primary sources
  { id:'marad-msci', lane:'maritime', name:'U.S. Maritime Security Advisories', kind:'official-page', url:'https://www.maritime.dot.gov/msci-advisories', includePath:'/msci/', type:'official', quality:1.00, regionId:'middle-east' },
  { id:'ukmto-incidents', lane:'maritime', name:'UKMTO Recent Incidents', kind:'official-page', url:'https://www.ukmto.org/recent-incidents', includePath:'/recent-incidents|/ukmto-products/', type:'official', quality:1.00, regionId:'middle-east' },
  { id:'taiwan-mnd', lane:'defense', name:'Taiwan Ministry of National Defense', kind:'official-page', url:'https://www.mnd.gov.tw/en/news/PressReleaseList', includePath:'/en/news/', type:'official', quality:1.00, regionId:'strategic-asia' },
  { id:'taiwan-pla-activity', lane:'defense', name:'Taiwan MND PLA Activity', kind:'official-page', url:'https://www.mnd.gov.tw/en/tag/pla/7', includePath:'/en/news/plaact/', type:'official', quality:1.00, regionId:'strategic-asia' },
  { id:'japan-mod', lane:'defense', name:'Japan Ministry of Defense', kind:'official-page', url:'https://www.mod.go.jp/en/timeline/index.html', includePath:'/en/', type:'official', quality:1.00, regionId:'strategic-asia' },
  { id:'japan-mod-release', lane:'defense', name:'Japan MOD Press Releases', kind:'official-page', url:'https://www.mod.go.jp/en/press-release/', includePath:'/en/', type:'official', quality:1.00, regionId:'strategic-asia' },
  { id:'us-centcom', lane:'defense', name:'U.S. Central Command', kind:'official-page', url:'https://www.centcom.mil/MEDIA/PRESS-RELEASES/', includePath:'/MEDIA/PRESS-RELEASES/', type:'official', quality:1.00, regionId:'middle-east' },
  { id:'us-eucom', lane:'defense', name:'U.S. European Command', kind:'official-page', url:'https://www.eucom.mil/pressrelease', includePath:'/pressrelease/', type:'official', quality:1.00, regionId:'europe' },
  { id:'us-indo-pacom', lane:'defense', name:'U.S. Indo-Pacific Command', kind:'official-page', url:'https://www.pacom.mil/Media/News/', includePath:'/Media/', type:'official', quality:1.00, regionId:'strategic-asia' },

  // Sanctions, export controls and policy actions
  { id:'uk-sanctions', lane:'sanctions', name:'UK Sanctions List Updates', kind:'official-page', url:'https://www.gov.uk/government/publications/the-uk-sanctions-list', includePath:'/government/', type:'official', quality:1.00, regionId:'europe' },
  { id:'un-sanctions-updates', lane:'sanctions', name:'UN Security Council Sanctions Updates', kind:'official-page', url:'https://main.un.org/securitycouncil/en/content/list-updates-unsc-consolidated-list', includePath:'/securitycouncil/', type:'official', quality:1.00 },
  { id:'us-bis', lane:'sanctions', name:'U.S. Bureau of Industry and Security', kind:'official-page', url:'https://www.bis.gov/press-release', includePath:'/press', type:'official', quality:1.00, regionId:'north-america' },
  { id:'ustr-releases', lane:'policy', name:'U.S. Trade Representative', kind:'official-page', url:'https://ustr.gov/about-us/policy-offices/press-office/press-releases', includePath:'/press', type:'official', quality:1.00, regionId:'north-america' },
  { id:'commerce-releases', lane:'policy', name:'U.S. Commerce Department', kind:'official-page', url:'https://www.commerce.gov/news/press-releases', includePath:'/news/', type:'official', quality:1.00, regionId:'north-america' },

  // Cyber and critical infrastructure public defensive reporting
  { id:'cisa-advisories', lane:'cyber', name:'CISA Cybersecurity Advisories', kind:'official-page', url:'https://www.cisa.gov/news-events/cybersecurity-advisories', includePath:'/news-events/', type:'official', quality:1.00, regionId:'north-america' },
  { id:'cisa-ics', lane:'cyber', name:'CISA Industrial Control Advisories', kind:'official-page', url:'https://www.cisa.gov/news-events/ics-advisories', includePath:'/news-events/', type:'official', quality:1.00, regionId:'north-america' },
  { id:'cisa-kev', lane:'cyber', name:'CISA Known Exploited Vulnerabilities', kind:'official-page', url:'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', includePath:'/news-events/|/known-exploited-', type:'official', quality:1.00, regionId:'north-america' },
  { id:'uk-ncsc', lane:'cyber', name:'UK National Cyber Security Centre', kind:'official-page', url:'https://www.ncsc.gov.uk/section/keep-up-to-date/all-blogs-news-advisories', includePath:'/news|/guidance|/report|/blog', type:'official', quality:1.00, regionId:'europe' },
  { id:'enisa-news', lane:'cyber', name:'EU Agency for Cybersecurity', kind:'official-page', url:'https://www.enisa.europa.eu/news', includePath:'/news/', type:'official', quality:1.00, regionId:'europe' },

  // Central banks, energy and macro primary sources
  { id:'boe-news', lane:'markets', name:'Bank of England', kind:'official-page', url:'https://www.bankofengland.co.uk/news', includePath:'/news/', type:'official', quality:1.00, regionId:'europe' },
  { id:'boj-news', lane:'markets', name:'Bank of Japan', kind:'official-page', url:'https://www.boj.or.jp/en/announcements/index.htm', includePath:'/en/announcements/', type:'official', quality:1.00, regionId:'strategic-asia' },
  { id:'eia-energy', lane:'energy', name:'U.S. Energy Information Administration', kind:'official-page', url:'https://www.eia.gov/todayinenergy/', includePath:'/todayinenergy/', type:'official', quality:1.00, regionId:'north-america' },
  { id:'iea-news', lane:'energy', name:'International Energy Agency', kind:'official-page', url:'https://www.iea.org/news', includePath:'/news/', type:'official', quality:0.98 },
  { id:'opec-news', lane:'energy', name:'OPEC News', kind:'official-page', url:'https://www.opec.org/opec_web/en/press_room/28.htm', includePath:'/press_room/', type:'official', quality:0.94, regionId:'middle-east' },
  { id:'us-energy', lane:'energy', name:'U.S. Department of Energy', kind:'official-page', url:'https://www.energy.gov/articles', includePath:'/articles/', type:'official', quality:1.00, regionId:'north-america' },

  // Asia policy, trade and supply chain primary sources
  { id:'china-mofcom', lane:'policy', name:'China Ministry of Commerce', kind:'official-page', url:'http://english.mofcom.gov.cn/article/newsrelease/', includePath:'/article/', type:'official', quality:0.82, regionId:'strategic-asia' },
  { id:'china-mfa', lane:'policy', name:'China Foreign Ministry', kind:'official-page', url:'https://www.fmprc.gov.cn/eng/xw/fyrbt/', includePath:'/eng/', type:'official', quality:0.80, regionId:'strategic-asia' },
  { id:'korea-mofa', lane:'policy', name:'Republic of Korea Foreign Ministry', kind:'official-page', url:'https://www.mofa.go.kr/eng/brd/m_5676/list.do', includePath:'/eng/', type:'official', quality:1.00, regionId:'strategic-asia' },
  { id:'japan-meti', lane:'policy', name:'Japan Ministry of Economy Trade and Industry', kind:'official-page', url:'https://www.meti.go.jp/english/press/index.html', includePath:'/english/press/', type:'official', quality:1.00, regionId:'strategic-asia' },

  // Specialist high-signal reporting feeds (not tabloids)
  { id:'dw-world', lane:'reporting', name:'Deutsche Welle World', kind:'rss', url:'https://rss.dw.com/rdf/rss-en-world', type:'publisher', quality:0.83, regionId:'europe' },
  { id:'rferl', lane:'reporting', name:'Radio Free Europe/Radio Liberty', kind:'rss', url:'https://www.rferl.org/api/zrqiteuuir', type:'publisher', quality:0.80, regionId:'russia-eurasia' },
  { id:'taiwan-cna', lane:'reporting', name:'Focus Taiwan / CNA', kind:'official-page', url:'https://focustaiwan.tw/politics', includePath:'focustaiwan.tw/', type:'publisher', quality:0.88, regionId:'strategic-asia' }
]);

export function gdeltSources(){
  return collectionStreams().map(stream=>({
    id:`gdelt-${stream.regionId}-${stream.id}`,
    name:`GDELT · ${stream.regionId} · ${stream.label}`,
    kind:'gdelt',
    lane:'discovery',
    type:'discovery',
    quality:0.72,
    regionId:stream.regionId,
    streamId:stream.id,
    query:gdeltQueryFor(stream)
  }));
}

export function liveSourceCatalog(){
  return [...DIRECT_SOURCES,...gdeltSources()];
}
