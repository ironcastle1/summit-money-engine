export const SOURCE_POLICY = Object.freeze([
  {
    "domain": "reuters.com",
    "name": "Reuters",
    "class": "wire",
    "quality": 0.98,
    "alignment": "independent",
    "note": "Global wire; high signal-to-noise.",
    "mode": "reporting"
  },
  {
    "domain": "apnews.com",
    "name": "Associated Press",
    "class": "wire",
    "quality": 0.95,
    "alignment": "independent",
    "note": "Global wire.",
    "mode": "reporting"
  },
  {
    "domain": "bbc.com",
    "name": "BBC",
    "class": "major",
    "quality": 0.9,
    "alignment": "public-service",
    "note": "Broad international reporting.",
    "mode": "reporting"
  },
  {
    "domain": "bbc.co.uk",
    "name": "BBC",
    "class": "major",
    "quality": 0.9,
    "alignment": "public-service",
    "note": "Broad international reporting.",
    "mode": "reporting"
  },
  {
    "domain": "bbci.co.uk",
    "name": "BBC",
    "class": "major",
    "quality": 0.9,
    "alignment": "public-service",
    "note": "BBC feed and media delivery domain.",
    "mode": "reporting"
  },
  {
    "domain": "ft.com",
    "name": "Financial Times",
    "class": "financial",
    "quality": 0.94,
    "alignment": "independent",
    "note": "Markets, policy and corporate impact.",
    "mode": "reporting"
  },
  {
    "domain": "bloomberg.com",
    "name": "Bloomberg",
    "class": "financial",
    "quality": 0.94,
    "alignment": "independent",
    "note": "Markets and policy.",
    "mode": "reporting"
  },
  {
    "domain": "wsj.com",
    "name": "Wall Street Journal",
    "class": "financial",
    "quality": 0.91,
    "alignment": "independent",
    "note": "Markets, policy and business.",
    "mode": "reporting"
  },
  {
    "domain": "cnbc.com",
    "name": "CNBC",
    "class": "financial",
    "quality": 0.84,
    "alignment": "independent",
    "note": "Fast markets and business coverage.",
    "mode": "reporting"
  },
  {
    "domain": "economist.com",
    "name": "The Economist",
    "class": "analysis",
    "quality": 0.86,
    "alignment": "independent",
    "note": "Analysis rather than breaking news.",
    "mode": "reporting"
  },
  {
    "domain": "politico.com",
    "name": "POLITICO",
    "class": "policy",
    "quality": 0.84,
    "alignment": "independent",
    "note": "US policy and politics.",
    "mode": "reporting"
  },
  {
    "domain": "politico.eu",
    "name": "POLITICO Europe",
    "class": "policy",
    "quality": 0.86,
    "alignment": "independent",
    "note": "EU policy and politics.",
    "mode": "reporting"
  },
  {
    "domain": "dw.com",
    "name": "Deutsche Welle",
    "class": "major",
    "quality": 0.83,
    "alignment": "public-service",
    "note": "Europe and international.",
    "mode": "reporting"
  },
  {
    "domain": "france24.com",
    "name": "France 24",
    "class": "major",
    "quality": 0.82,
    "alignment": "public-service",
    "note": "International reporting.",
    "mode": "reporting"
  },
  {
    "domain": "euronews.com",
    "name": "Euronews",
    "class": "major",
    "quality": 0.79,
    "alignment": "independent",
    "note": "European news.",
    "mode": "reporting"
  },
  {
    "domain": "theguardian.com",
    "name": "The Guardian",
    "class": "major",
    "quality": 0.8,
    "alignment": "independent",
    "note": "International and UK reporting.",
    "mode": "reporting"
  },
  {
    "domain": "nytimes.com",
    "name": "New York Times",
    "class": "major",
    "quality": 0.89,
    "alignment": "independent",
    "note": "US and international.",
    "mode": "reporting"
  },
  {
    "domain": "washingtonpost.com",
    "name": "Washington Post",
    "class": "major",
    "quality": 0.87,
    "alignment": "independent",
    "note": "US policy and international.",
    "mode": "reporting"
  },
  {
    "domain": "axios.com",
    "name": "Axios",
    "class": "policy",
    "quality": 0.83,
    "alignment": "independent",
    "note": "Fast US policy reporting.",
    "mode": "reporting"
  },
  {
    "domain": "foreignpolicy.com",
    "name": "Foreign Policy",
    "class": "analysis",
    "quality": 0.84,
    "alignment": "independent",
    "note": "Foreign affairs analysis.",
    "mode": "reporting"
  },
  {
    "domain": "defensenews.com",
    "name": "Defense News",
    "class": "specialist",
    "quality": 0.83,
    "alignment": "independent",
    "note": "Defence procurement and posture.",
    "mode": "reporting"
  },
  {
    "domain": "breakingdefense.com",
    "name": "Breaking Defense",
    "class": "specialist",
    "quality": 0.82,
    "alignment": "independent",
    "note": "Defence and technology.",
    "mode": "reporting"
  },
  {
    "domain": "janes.com",
    "name": "Janes",
    "class": "specialist",
    "quality": 0.92,
    "alignment": "independent",
    "note": "High-grade defence/security reporting.",
    "mode": "reporting"
  },
  {
    "domain": "aljazeera.com",
    "name": "Al Jazeera",
    "class": "major",
    "quality": 0.82,
    "alignment": "state-funded",
    "note": "Middle East and global reporting; corroborate politically sensitive claims.",
    "mode": "reporting"
  },
  {
    "domain": "timesofisrael.com",
    "name": "Times of Israel",
    "class": "regional",
    "quality": 0.83,
    "alignment": "independent",
    "note": "Israel and regional reporting.",
    "mode": "reporting"
  },
  {
    "domain": "haaretz.com",
    "name": "Haaretz",
    "class": "regional",
    "quality": 0.82,
    "alignment": "independent",
    "note": "Israel and regional reporting.",
    "mode": "reporting"
  },
  {
    "domain": "jpost.com",
    "name": "Jerusalem Post",
    "class": "regional",
    "quality": 0.78,
    "alignment": "independent",
    "note": "Israel and regional reporting.",
    "mode": "reporting"
  },
  {
    "domain": "arabnews.com",
    "name": "Arab News",
    "class": "regional",
    "quality": 0.76,
    "alignment": "private-aligned",
    "note": "Gulf and Middle East business/politics.",
    "mode": "reporting"
  },
  {
    "domain": "thenationalnews.com",
    "name": "The National",
    "class": "regional",
    "quality": 0.78,
    "alignment": "state-linked",
    "note": "UAE-based regional reporting.",
    "mode": "reporting"
  },
  {
    "domain": "middleeasteye.net",
    "name": "Middle East Eye",
    "class": "regional",
    "quality": 0.7,
    "alignment": "independent",
    "note": "Regional reporting; corroborate contested claims.",
    "mode": "reporting"
  },
  {
    "domain": "iranintl.com",
    "name": "Iran International",
    "class": "regional",
    "quality": 0.69,
    "alignment": "opposition-aligned",
    "note": "Iran-focused; useful but requires corroboration.",
    "mode": "reporting"
  },
  {
    "domain": "themoscowtimes.com",
    "name": "Moscow Times",
    "class": "regional",
    "quality": 0.8,
    "alignment": "independent",
    "note": "Russia-focused independent reporting.",
    "mode": "reporting"
  },
  {
    "domain": "rferl.org",
    "name": "RFE/RL",
    "class": "regional",
    "quality": 0.8,
    "alignment": "us-funded",
    "note": "Russia/Eurasia; disclose funding and corroborate.",
    "mode": "reporting"
  },
  {
    "domain": "meduza.io",
    "name": "Meduza",
    "class": "regional",
    "quality": 0.79,
    "alignment": "independent",
    "note": "Russia-focused independent reporting.",
    "mode": "reporting"
  },
  {
    "domain": "tass.com",
    "name": "TASS",
    "class": "state",
    "quality": 0.56,
    "alignment": "state-controlled",
    "note": "Useful for official Russian posture; claims require corroboration.",
    "mode": "reporting"
  },
  {
    "domain": "interfax.com",
    "name": "Interfax",
    "class": "wire",
    "quality": 0.76,
    "alignment": "russia-based",
    "note": "Russian wire/business reporting.",
    "mode": "reporting"
  },
  {
    "domain": "kyivindependent.com",
    "name": "Kyiv Independent",
    "class": "regional",
    "quality": 0.78,
    "alignment": "independent",
    "note": "Ukraine-focused; corroborate battlefield claims.",
    "mode": "reporting"
  },
  {
    "domain": "asia.nikkei.com",
    "name": "Nikkei Asia",
    "class": "financial",
    "quality": 0.91,
    "alignment": "independent",
    "note": "Asian business, policy and supply chains.",
    "mode": "reporting"
  },
  {
    "domain": "nikkei.com",
    "name": "Nikkei",
    "class": "financial",
    "quality": 0.91,
    "alignment": "independent",
    "note": "Asian business and markets.",
    "mode": "reporting"
  },
  {
    "domain": "scmp.com",
    "name": "South China Morning Post",
    "class": "regional",
    "quality": 0.81,
    "alignment": "independent",
    "note": "China and Asia; useful policy reporting.",
    "mode": "reporting"
  },
  {
    "domain": "channelnewsasia.com",
    "name": "Channel News Asia",
    "class": "regional",
    "quality": 0.83,
    "alignment": "state-owned",
    "note": "Singapore-based regional reporting.",
    "mode": "reporting"
  },
  {
    "domain": "straitstimes.com",
    "name": "Straits Times",
    "class": "regional",
    "quality": 0.8,
    "alignment": "mainstream",
    "note": "Singapore and Asia.",
    "mode": "reporting"
  },
  {
    "domain": "japantimes.co.jp",
    "name": "Japan Times",
    "class": "regional",
    "quality": 0.79,
    "alignment": "independent",
    "note": "Japan and regional reporting.",
    "mode": "reporting"
  },
  {
    "domain": "kyodonews.net",
    "name": "Kyodo News",
    "class": "wire",
    "quality": 0.87,
    "alignment": "cooperative",
    "note": "Japan wire reporting.",
    "mode": "reporting"
  },
  {
    "domain": "english.kyodonews.net",
    "name": "Kyodo News",
    "class": "wire",
    "quality": 0.87,
    "alignment": "cooperative",
    "note": "Japan wire reporting.",
    "mode": "reporting"
  },
  {
    "domain": "yonhapnews.co.kr",
    "name": "Yonhap",
    "class": "wire",
    "quality": 0.86,
    "alignment": "public-corporation",
    "note": "Korea wire reporting.",
    "mode": "reporting"
  },
  {
    "domain": "koreaherald.com",
    "name": "Korea Herald",
    "class": "regional",
    "quality": 0.79,
    "alignment": "independent",
    "note": "South Korea and regional.",
    "mode": "reporting"
  },
  {
    "domain": "koreatimes.co.kr",
    "name": "Korea Times",
    "class": "regional",
    "quality": 0.76,
    "alignment": "independent",
    "note": "South Korea and regional.",
    "mode": "reporting"
  },
  {
    "domain": "focustaiwan.tw",
    "name": "Focus Taiwan / CNA",
    "class": "wire",
    "quality": 0.86,
    "alignment": "public-corporation",
    "note": "Taiwan wire reporting.",
    "mode": "reporting"
  },
  {
    "domain": "taipeitimes.com",
    "name": "Taipei Times",
    "class": "regional",
    "quality": 0.79,
    "alignment": "independent",
    "note": "Taiwan-focused reporting.",
    "mode": "reporting"
  },
  {
    "domain": "taiwannews.com.tw",
    "name": "Taiwan News",
    "class": "regional",
    "quality": 0.74,
    "alignment": "independent",
    "note": "Taiwan-focused reporting.",
    "mode": "reporting"
  },
  {
    "domain": "xinhua.net",
    "name": "Xinhua",
    "class": "state",
    "quality": 0.55,
    "alignment": "state-controlled",
    "note": "Useful for official Chinese posture; corroboration required.",
    "mode": "reporting"
  },
  {
    "domain": "news.cn",
    "name": "Xinhua",
    "class": "state",
    "quality": 0.55,
    "alignment": "state-controlled",
    "note": "Useful for official Chinese posture; corroboration required.",
    "mode": "reporting"
  },
  {
    "domain": "globaltimes.cn",
    "name": "Global Times",
    "class": "state",
    "quality": 0.45,
    "alignment": "state-controlled",
    "note": "Treat as signalling/official posture, not verified fact.",
    "mode": "reporting"
  },
  {
    "domain": "thehindu.com",
    "name": "The Hindu",
    "class": "regional",
    "quality": 0.83,
    "alignment": "independent",
    "note": "India policy and regional reporting.",
    "mode": "reporting"
  },
  {
    "domain": "indianexpress.com",
    "name": "Indian Express",
    "class": "regional",
    "quality": 0.81,
    "alignment": "independent",
    "note": "India policy and security.",
    "mode": "reporting"
  },
  {
    "domain": "livemint.com",
    "name": "Mint",
    "class": "financial",
    "quality": 0.8,
    "alignment": "independent",
    "note": "India business and markets.",
    "mode": "reporting"
  },
  {
    "domain": "business-standard.com",
    "name": "Business Standard",
    "class": "financial",
    "quality": 0.8,
    "alignment": "independent",
    "note": "India business and policy.",
    "mode": "reporting"
  },
  {
    "domain": "whitehouse.gov",
    "name": "White House",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "US executive primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "state.gov",
    "name": "U.S. Department of State",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "US diplomacy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "treasury.gov",
    "name": "U.S. Treasury",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "Sanctions, fiscal and financial policy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "ofac.treasury.gov",
    "name": "OFAC",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "US sanctions primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "defense.gov",
    "name": "U.S. Department of Defense",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "US defence primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "federalreserve.gov",
    "name": "Federal Reserve",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "US monetary policy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "commerce.gov",
    "name": "U.S. Commerce Department",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "Trade and industrial policy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "bis.gov",
    "name": "Bureau of Industry and Security",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "US export controls primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "energy.gov",
    "name": "U.S. Department of Energy",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "US energy policy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "eia.gov",
    "name": "U.S. EIA",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "US energy statistics primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "cisa.gov",
    "name": "CISA",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "US cybersecurity primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "europa.eu",
    "name": "European Union",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "EU primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "ec.europa.eu",
    "name": "European Commission",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "EU executive primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "consilium.europa.eu",
    "name": "Council of the EU",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "EU member-state decisions primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "ecb.europa.eu",
    "name": "European Central Bank",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "Euro monetary policy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "bankofengland.co.uk",
    "name": "Bank of England",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "UK monetary policy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "gov.uk",
    "name": "UK Government",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "UK government primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "nato.int",
    "name": "NATO",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "NATO primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "osce.org",
    "name": "OSCE",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "European security primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "kremlin.ru",
    "name": "Kremlin",
    "class": "official",
    "quality": 0.8,
    "alignment": "primary-source",
    "note": "Russian presidency primary-source claim",
    "mode": "primary-claim"
  },
  {
    "domain": "mid.ru",
    "name": "Russian Foreign Ministry",
    "class": "official",
    "quality": 0.78,
    "alignment": "primary-source",
    "note": "Russian diplomatic primary-source claim",
    "mode": "primary-claim"
  },
  {
    "domain": "cbr.ru",
    "name": "Bank of Russia",
    "class": "official",
    "quality": 0.92,
    "alignment": "primary-source",
    "note": "Russian monetary/financial primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "iaea.org",
    "name": "IAEA",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "Nuclear safeguards and technical primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "un.org",
    "name": "United Nations",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "UN primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "reliefweb.int",
    "name": "ReliefWeb/OCHA",
    "class": "official",
    "quality": 0.96,
    "alignment": "primary-source",
    "note": "Curated humanitarian reporting",
    "mode": "primary-claim"
  },
  {
    "domain": "mfa.gov.il",
    "name": "Israel Ministry of Foreign Affairs",
    "class": "official",
    "quality": 0.82,
    "alignment": "primary-source",
    "note": "Israeli official claim",
    "mode": "primary-claim"
  },
  {
    "domain": "gov.il",
    "name": "Government of Israel",
    "class": "official",
    "quality": 0.82,
    "alignment": "primary-source",
    "note": "Israeli official claim",
    "mode": "primary-claim"
  },
  {
    "domain": "mod.gov.il",
    "name": "Israel Ministry of Defense",
    "class": "official",
    "quality": 0.82,
    "alignment": "primary-source",
    "note": "Israeli defence claim",
    "mode": "primary-claim"
  },
  {
    "domain": "mfa.gov.ir",
    "name": "Iran Ministry of Foreign Affairs",
    "class": "official",
    "quality": 0.72,
    "alignment": "primary-source",
    "note": "Iranian official claim",
    "mode": "primary-claim"
  },
  {
    "domain": "president.ir",
    "name": "Iranian Presidency",
    "class": "official",
    "quality": 0.7,
    "alignment": "primary-source",
    "note": "Iranian official claim",
    "mode": "primary-claim"
  },
  {
    "domain": "spa.gov.sa",
    "name": "Saudi Press Agency",
    "class": "official",
    "quality": 0.76,
    "alignment": "primary-source",
    "note": "Saudi official claim",
    "mode": "primary-claim"
  },
  {
    "domain": "mofa.gov.sa",
    "name": "Saudi Foreign Ministry",
    "class": "official",
    "quality": 0.78,
    "alignment": "primary-source",
    "note": "Saudi diplomatic primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "mofa.gov.ae",
    "name": "UAE Foreign Ministry",
    "class": "official",
    "quality": 0.78,
    "alignment": "primary-source",
    "note": "UAE diplomatic primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "fmprc.gov.cn",
    "name": "China Ministry of Foreign Affairs",
    "class": "official",
    "quality": 0.78,
    "alignment": "primary-source",
    "note": "Chinese diplomatic primary-source claim",
    "mode": "primary-claim"
  },
  {
    "domain": "pbc.gov.cn",
    "name": "People\u2019s Bank of China",
    "class": "official",
    "quality": 0.92,
    "alignment": "primary-source",
    "note": "Chinese monetary policy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "mofa.go.jp",
    "name": "Japan Ministry of Foreign Affairs",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "Japanese diplomacy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "mod.go.jp",
    "name": "Japan Ministry of Defense",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "Japanese defence primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "boj.or.jp",
    "name": "Bank of Japan",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "Japanese monetary policy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "mofa.go.kr",
    "name": "South Korea Ministry of Foreign Affairs",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "Korean diplomacy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "bok.or.kr",
    "name": "Bank of Korea",
    "class": "official",
    "quality": 1.0,
    "alignment": "primary-source",
    "note": "Korean monetary policy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "mofa.gov.tw",
    "name": "Taiwan Ministry of Foreign Affairs",
    "class": "official",
    "quality": 0.96,
    "alignment": "primary-source",
    "note": "Taiwan diplomacy primary source",
    "mode": "primary-claim"
  },
  {
    "domain": "mnd.gov.tw",
    "name": "Taiwan Ministry of National Defense",
    "class": "official",
    "quality": 0.96,
    "alignment": "primary-source",
    "note": "Taiwan defence primary source",
    "mode": "primary-claim"
  }
]);

export const SOURCE_BY_DOMAIN = new Map(SOURCE_POLICY.map(s=>[s.domain,s]));
export const BLOCKED_DOMAINS = Object.freeze([
  "dailymail.co.uk",
  "thesun.co.uk",
  "mirror.co.uk",
  "express.co.uk",
  "nypost.com",
  "tmz.com",
  "buzzfeed.com",
  "ladbible.com",
  "unilad.com",
  "gbnews.com",
  "dailycaller.com",
  "infowars.com"
]);
export function sourcePolicyForUrl(url){ try{ const host=new URL(url).hostname.toLowerCase().replace(/^www\./,''); if(BLOCKED_DOMAINS.some(d=>host===d||host.endsWith('.'+d)))return {blocked:true,quality:0,name:host,class:'blocked',mode:'blocked'}; const exact=SOURCE_BY_DOMAIN.get(host); if(exact)return exact; const row=SOURCE_POLICY.find(s=>host.endsWith('.'+s.domain)); return row||{domain:host,name:host,class:'unknown',quality:0.45,alignment:'unknown',mode:'unvetted'}; }catch{return {blocked:true,quality:0,name:'invalid',class:'blocked',mode:'blocked'};} }
export function isAllowedReportingDomain(url){ const p=sourcePolicyForUrl(url); return !p.blocked && p.quality>=0.68; }
