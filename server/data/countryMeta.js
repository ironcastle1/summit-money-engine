const countryMeta = [
  { iso2: "GB", name: "United Kingdom", region: "Europe", slug: "united-kingdom", centre: [54.5, -2.5], priority: "Europe-first", localCrime: "data.police.uk" },
  { iso2: "IE", name: "Ireland", region: "Europe", slug: "ireland", centre: [53.2, -7.7] },
  { iso2: "FR", name: "France", region: "Europe", slug: "france", centre: [46.2, 2.2] },
  { iso2: "DE", name: "Germany", region: "Europe", slug: "germany", centre: [51.1, 10.4] },
  { iso2: "ES", name: "Spain", region: "Europe", slug: "spain", centre: [40.4, -3.7] },
  { iso2: "PT", name: "Portugal", region: "Europe", slug: "portugal", centre: [39.4, -8.2] },
  { iso2: "IT", name: "Italy", region: "Europe", slug: "italy", centre: [42.8, 12.5] },
  { iso2: "NL", name: "Netherlands", region: "Europe", slug: "netherlands", centre: [52.1, 5.3] },
  { iso2: "BE", name: "Belgium", region: "Europe", slug: "belgium", centre: [50.7, 4.6] },
  { iso2: "PL", name: "Poland", region: "Europe", slug: "poland", centre: [52.1, 19.3] },
  { iso2: "UA", name: "Ukraine", region: "Europe", slug: "ukraine", centre: [49, 31], watch: true },
  { iso2: "RU", name: "Russia", region: "Europe/Asia", slug: "russia", centre: [61.5, 90], watch: true },
  { iso2: "SE", name: "Sweden", region: "Europe", slug: "sweden", centre: [62, 15] },
  { iso2: "NO", name: "Norway", region: "Europe", slug: "norway", centre: [62, 10] },
  { iso2: "FI", name: "Finland", region: "Europe", slug: "finland", centre: [64, 26] },
  { iso2: "DK", name: "Denmark", region: "Europe", slug: "denmark", centre: [56, 10] },
  { iso2: "CH", name: "Switzerland", region: "Europe", slug: "switzerland", centre: [46.8, 8.2] },
  { iso2: "AT", name: "Austria", region: "Europe", slug: "austria", centre: [47.5, 14.5] },
  { iso2: "CZ", name: "Czechia", region: "Europe", slug: "czechia", centre: [49.8, 15.5] },
  { iso2: "SK", name: "Slovakia", region: "Europe", slug: "slovakia", centre: [48.7, 19.7] },
  { iso2: "HU", name: "Hungary", region: "Europe", slug: "hungary", centre: [47.1, 19.5] },
  { iso2: "RO", name: "Romania", region: "Europe", slug: "romania", centre: [45.9, 24.9] },
  { iso2: "BG", name: "Bulgaria", region: "Europe", slug: "bulgaria", centre: [42.7, 25.5] },
  { iso2: "GR", name: "Greece", region: "Europe", slug: "greece", centre: [39, 22] },
  { iso2: "TR", name: "Turkey", region: "Europe/Middle East", slug: "turkey", centre: [39, 35], watch: true },
  { iso2: "SY", name: "Syria", region: "Middle East", slug: "syria", centre: [35, 38], watch: true, familyPriority: true },
  { iso2: "LB", name: "Lebanon", region: "Middle East", slug: "lebanon", centre: [33.9, 35.8], watch: true },
  { iso2: "IL", name: "Israel", region: "Middle East", slug: "israel", centre: [31.5, 35], watch: true },
  { iso2: "PS", name: "Palestine", region: "Middle East", slug: "palestine", centre: [31.9, 35.2], watch: true },
  { iso2: "IQ", name: "Iraq", region: "Middle East", slug: "iraq", centre: [33, 44], watch: true },
  { iso2: "IR", name: "Iran", region: "Middle East", slug: "iran", centre: [32, 53], watch: true },
  { iso2: "JO", name: "Jordan", region: "Middle East", slug: "jordan", centre: [31, 36] },
  { iso2: "SA", name: "Saudi Arabia", region: "Middle East", slug: "saudi-arabia", centre: [24.7, 46.7] },
  { iso2: "AE", name: "United Arab Emirates", region: "Middle East", slug: "united-arab-emirates", centre: [24, 54] },
  { iso2: "YE", name: "Yemen", region: "Middle East", slug: "yemen", centre: [15.5, 47.5], watch: true },
  { iso2: "SD", name: "Sudan", region: "Africa", slug: "sudan", centre: [15.6, 30.5], watch: true },
  { iso2: "SO", name: "Somalia", region: "Africa", slug: "somalia", centre: [5.1, 46.2], watch: true },
  { iso2: "ML", name: "Mali", region: "Africa", slug: "mali", centre: [17.5, -3.9], watch: true },
  { iso2: "BF", name: "Burkina Faso", region: "Africa", slug: "burkina-faso", centre: [12.2, -1.6], watch: true },
  { iso2: "NE", name: "Niger", region: "Africa", slug: "niger", centre: [17.6, 8.1], watch: true },
  { iso2: "NG", name: "Nigeria", region: "Africa", slug: "nigeria", centre: [9.1, 8.7] },
  { iso2: "EG", name: "Egypt", region: "Africa/Middle East", slug: "egypt", centre: [26.8, 30.8] },
  { iso2: "US", name: "United States", region: "North America", slug: "united-states", centre: [39, -98] },
  { iso2: "CA", name: "Canada", region: "North America", slug: "canada", centre: [56.1, -106.3] },
  { iso2: "CN", name: "China", region: "Asia", slug: "china", centre: [35.8, 104] },
  { iso2: "JP", name: "Japan", region: "Asia", slug: "japan", centre: [36.2, 138.2] },
  { iso2: "KR", name: "South Korea", region: "Asia", slug: "south-korea", centre: [36.2, 127.8] },
  { iso2: "KP", name: "North Korea", region: "Asia", slug: "north-korea", centre: [40, 127], watch: true },
  { iso2: "IN", name: "India", region: "Asia", slug: "india", centre: [22.9, 79] },
  { iso2: "PK", name: "Pakistan", region: "Asia", slug: "pakistan", centre: [30.3, 69.3], watch: true },
  { iso2: "AU", name: "Australia", region: "Oceania", slug: "australia", centre: [-25.3, 133.8] }
];

function byIso(iso2) { return countryMeta.find(c => c.iso2 === String(iso2 || "").toUpperCase()) || null; }
function byName(name) {
  const s = String(name || "").toLowerCase();
  if (!s) return null;
  return countryMeta.find(c => c.name.toLowerCase() === s || s.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(s)) || null;
}
function iso2FromCountry(name) { const row = byName(name); return row ? row.iso2 : null; }

module.exports = { countryMeta, byIso, byName, iso2FromCountry };
