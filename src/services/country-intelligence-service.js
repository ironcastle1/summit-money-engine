import { countryForEvent, normalizePlaceText } from '../domain/intelligence/match.js';
import { conflictRisk, disasterRisk } from '../domain/intelligence/event-risk.js';
import { analyseCrime } from '../domain/intelligence/crime.js';
import { analyseElections } from '../domain/intelligence/elections.js';
import { compositeSafetyRisk } from '../domain/intelligence/safety.js';
import { economicProfile } from '../domain/intelligence/economic.js';
import { round, clamp } from '../core/numbers.js';
import { ApplicationError } from '../core/errors.js';

function storyCountryMatch(story, country) {
  const codes = new Set((story.countries || []).map(value => String(value).toUpperCase()));
  if (codes.has(country.iso2) || codes.has(country.iso3)) return true;
  const text = normalizePlaceText(`${story.title || ''} ${story.summary || ''} ${(story.entities || []).join(' ')}`);
  return [country.name, country.nativeName, country.capital, ...(country.aliases || [])].some(alias => {
    const token = normalizePlaceText(alias); return token.length > 3 && text.includes(token);
  });
}

function newsMetrics(stories) {
  if (!stories?.length) return Object.freeze({ score: 0, confidence: 0, count: 0, verifiedCount: 0, stories: [] });
  const values = stories.map(story => {
    const verification = Number(story.verification?.score || 0);
    const riskImpact = (story.impacts || []).filter(item => item.direction === 'NEGATIVE').reduce((sum, item) => sum + Number(item.confidence || 0) / 100, 0);
    return (0.25 + verification / 100 * 0.75) * (1 + Math.min(2, riskImpact));
  });
  const score = round(clamp(100 * (1 - Math.exp(-values.reduce((a, b) => a + b, 0) / 5)), 0, 100), 1);
  const verifiedCount = stories.filter(story => Number(story.verification?.score || 0) >= 60).length;
  const confidence = round(clamp(20 + verifiedCount * 8 + Math.min(25, stories.length * 2), 0, 90), 1);
  return Object.freeze({ score, confidence, count: stories.length, verifiedCount, stories: stories.slice(0, 25) });
}

function sourceEvidenceConfidence(events, sourceStatus) {
  const online = Object.values(sourceStatus || {}).filter(source => ['ONLINE', 'DEGRADED'].includes(source.state)).length;
  const total = Object.keys(sourceStatus || {}).length;
  return round(clamp(20 + Math.min(45, events.length * 2) + (total ? online / total * 35 : 0), 0, 95), 1);
}

function metricBundle({ events, sourceStatus, crime, elections, economic, news }) {
  const conflict = conflictRisk(events);
  const disaster = disasterRisk(events);
  const eventConfidence = sourceEvidenceConfidence(events, sourceStatus);
  const composite = compositeSafetyRisk({
    conflictScore: conflict.score, disasterScore: disaster.score, crimeScore: crime?.score,
    newsRiskScore: news?.score, electionProximityScore: elections?.proximityScore,
    eventConfidence, crimeConfidence: crime?.confidence || 0, newsConfidence: news?.confidence || 0,
    electionConfidence: elections?.available ? 70 : 0
  });
  return Object.freeze({ conflict, disaster, crime: crime || null, elections: elections || null, economic: economic || null, news: news || null, composite, eventConfidence });
}

export class CountryIntelligenceService {
  constructor(options) {
    this.catalog = options.catalog; this.events = options.events; this.news = options.news;
    this.sources = options.sources; this.cache = options.cache;
  }

  async overview(options = {}) {
    const hours = Math.max(24, Math.min(720, Number(options.hours || 168)));
    const cacheKey = `country-overview:${hours}:${Boolean(options.includeNews)}`;
    const cached = await this.cache.getOrLoad(cacheKey, { ttlMs: 120_000, staleMs: 900_000 }, async () => {
      const eventSnapshot = await this.events.globalSnapshot({ since: Date.now() - hours * 3_600_000, limit: 5000 });
      const eventGroups = new Map(this.catalog.countries.map(country => [country.iso2, []]));
      for (const event of eventSnapshot.events) {
        const match = countryForEvent(event, this.catalog.countries, this.catalog.countryLookup);
        if (match) eventGroups.get(match.country.iso2)?.push(event);
      }
      let stories = [];
      let newsSources = {};
      if (options.includeNews) {
        const result = await this.news.search({ query: '', hours: Math.min(hours, 168), sourceLimit: 120, limit: 100, includeEventLinks: false });
        stories = result.stories || []; newsSources = result.sources || {};
      }
      const metrics = new Map();
      const countries = this.catalog.countries.map(country => {
        const countryEvents = eventGroups.get(country.iso2) || [];
        const countryStories = options.includeNews ? stories.filter(story => storyCountryMatch(story, country)) : [];
        const bundle = metricBundle({ events: countryEvents, sourceStatus: eventSnapshot.sources, news: options.includeNews ? newsMetrics(countryStories) : null });
        metrics.set(country.iso2, bundle);
        return Object.freeze({ country, metrics: bundle, eventCount: countryEvents.length, storyCount: countryStories.length });
      }).sort((a, b) => (b.metrics.composite.score ?? -1) - (a.metrics.composite.score ?? -1));
      return { countries, metrics, eventSources: eventSnapshot.sources, newsSources, generatedAt: new Date().toISOString() };
    });
    const minimumRisk = Number(options.minimumRisk || 0);
    const region = normalizePlaceText(options.region);
    const query = normalizePlaceText(options.query);
    const limit = Math.max(1, Math.min(300, Number(options.limit || 250)));
    const filtered = cached.value.countries.filter(item => {
      if (region && ![item.country.region, item.country.subregion].some(value => normalizePlaceText(value) === region)) return false;
      if (query && !normalizePlaceText(`${item.country.name} ${item.country.nativeName} ${item.country.capital} ${item.country.iso2}`).includes(query)) return false;
      return Number(item.metrics.composite.score || 0) >= minimumRisk;
    }).slice(0, limit);
    const metricMap = new Map(filtered.map(item => [item.country.iso2, item.metrics]));
    return Object.freeze({
      summary: this.catalog.summary(), countries: filtered, geojson: this.catalog.geojson(metricMap, new Map()),
      eventSources: cached.value.eventSources, newsSources: cached.value.newsSources,
      intelligenceSources: this.sources.health(), generatedAt: cached.value.generatedAt, cache: cached.cache
    });
  }

  async countryDetail(id, options = {}) {
    const country = this.catalog.country(id);
    if (!country) throw new ApplicationError('Country not found', { code: 'COUNTRY_NOT_FOUND', statusCode: 404, details: { id }, expose: true });
    const hours = Math.max(24, Math.min(720, Number(options.hours || 168)));
    const eventSnapshot = await this.events.globalSnapshot({ since: Date.now() - hours * 3_600_000, limit: 5000 });
    const countryEvents = eventSnapshot.events.filter(event => countryForEvent(event, this.catalog.countries, this.catalog.countryLookup)?.country.iso2 === country.iso2);
    const worldBank = this.sources.get('world-bank');
    const ukPolice = this.sources.get('uk-police');
    const reliefweb = this.sources.get('reliefweb');
    const civic = this.sources.get('google-civic');
    const [newsResult, indicatorsResult, crimeResult, reliefResult, electionResult] = await Promise.all([
      this.news.search({ query: country.name, hours: Math.min(hours, 168), sourceLimit: 120, limit: 60, includeEventLinks: true }).catch(() => ({ stories: [], sources: {} })),
      worldBank.countryIndicators(country.iso2),
      ukPolice.crimesAt({ lat: country.capitalLat, lon: country.capitalLon }, { countryCode: country.iso2 }),
      reliefweb.reports({ country: country.name, limit: 40 }),
      civic.elections()
    ]);
    const countryStories = (newsResult.stories || []).filter(story => storyCountryMatch(story, country));
    const crime = analyseCrime(crimeResult.data);
    const elections = analyseElections(electionResult.data, { countryCode: country.iso2 });
    const economic = economicProfile(indicatorsResult.data?.indicators || {});
    const news = newsMetrics(countryStories);
    const metrics = metricBundle({ events: countryEvents, sourceStatus: eventSnapshot.sources, crime, elections, economic, news });
    return Object.freeze({
      country, metrics, events: countryEvents.slice(0, 250), stories: countryStories.slice(0, 40),
      humanitarian: reliefResult.data || null, indicators: indicatorsResult.data || null,
      crimeData: crimeResult.data || null, electionData: electionResult.data || null,
      sources: { events: eventSnapshot.sources, news: newsResult.sources || {}, intelligence: this.sources.health() },
      generatedAt: new Date().toISOString()
    });
  }

  async cityDetail(id, options = {}) {
    const city = this.catalog.city(id);
    if (!city) throw new ApplicationError('City not found', { code: 'CITY_NOT_FOUND', statusCode: 404, details: { id }, expose: true });
    const country = this.catalog.country(city.countryCode);
    const radiusKm = Math.max(10, Math.min(500, Number(options.radiusKm || 100)));
    const lookbackDays = Math.max(1, Math.min(30, Number(options.lookbackDays || 7)));
    const [scan, crimeResult, newsResult] = await Promise.all([
      this.events.scanRadius({ lat: city.lat, lon: city.lon, radiusKm, lookbackDays, eventLimit: 300 }),
      this.sources.get('uk-police').crimesAt(city, { countryCode: city.countryCode }),
      this.news.search({ query: `${city.name} ${city.country}`, hours: Math.min(168, lookbackDays * 24), sourceLimit: 100, limit: 50, includeEventLinks: true }).catch(() => ({ stories: [], sources: {} }))
    ]);
    const crime = analyseCrime(crimeResult.data);
    const electionsResult = await this.sources.get('google-civic').elections();
    const elections = analyseElections(electionsResult.data, { countryCode: city.countryCode });
    const news = newsMetrics(newsResult.stories || []);
    const metrics = metricBundle({ events: scan.events, sourceStatus: scan.sourceStatus, crime, elections, economic: null, news });
    return Object.freeze({ city, country, point: { lat: city.lat, lon: city.lon, radiusKm }, metrics, events: scan.events, stories: newsResult.stories || [], sources: { events: scan.sourceStatus, news: newsResult.sources || {}, intelligence: this.sources.health() }, generatedAt: new Date().toISOString() });
  }
  async pointDetail(point, options = {}) {
    const radiusKm = Math.max(10, Math.min(1000, Number(options.radiusKm || 100)));
    const lookbackDays = Math.max(1, Math.min(30, Number(options.lookbackDays || 7)));
    const nearestCity = this.catalog.nearestCity(point, 750);
    const nearestCountry = this.catalog.nearestCountry(point);
    const country = nearestCity?.city ? this.catalog.country(nearestCity.city.countryCode) : nearestCountry?.country || null;
    const [scan, crimeResult, newsResult, electionResult] = await Promise.all([
      this.events.scanRadius({ lat: point.lat, lon: point.lon, radiusKm, lookbackDays, eventLimit: 300 }),
      this.sources.get('uk-police').crimesAt(point, { countryCode: country?.iso2 }),
      this.news.search({ query: nearestCity?.city ? `${nearestCity.city.name} ${nearestCity.city.country}` : country?.name || '', hours: Math.min(168, lookbackDays * 24), sourceLimit: 100, limit: 50, includeEventLinks: true }).catch(() => ({ stories: [], sources: {} })),
      this.sources.get('google-civic').elections()
    ]);
    const crime = analyseCrime(crimeResult.data);
    const elections = analyseElections(electionResult.data, { countryCode: country?.iso2 });
    const news = newsMetrics(newsResult.stories || []);
    const metrics = metricBundle({ events: scan.events, sourceStatus: scan.sourceStatus, crime, elections, economic: null, news });
    return Object.freeze({
      point: { lat: Number(point.lat), lon: Number(point.lon), radiusKm }, country,
      nearestCity: nearestCity ? { ...nearestCity.city, distanceKm: round(nearestCity.distanceKm, 1) } : null,
      metrics, events: scan.events, stories: newsResult.stories || [],
      sources: { events: scan.sourceStatus, news: newsResult.sources || {}, intelligence: this.sources.health() }, generatedAt: new Date().toISOString()
    });
  }

}
