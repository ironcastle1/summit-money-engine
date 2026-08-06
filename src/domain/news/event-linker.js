import { clamp, round } from '../../core/numbers.js';
import { HOUR_MS, toTimestamp } from '../../core/time.js';
import { jaccardSimilarity, tokenSet } from './text.js';

const COUNTRY_NAMES = Object.freeze({ IQ: ['iraq'], IL: ['israel'], IR: ['iran'], UA: ['ukraine'], RU: ['russia'], US: ['united states','usa'], GB: ['united kingdom','britain','england'], CN: ['china'], TW: ['taiwan'], SY: ['syria'], LB: ['lebanon'], JO: ['jordan'], EG: ['egypt'], SA: ['saudi arabia'], AE: ['united arab emirates','uae'], YE: ['yemen'], SD: ['sudan'], LY: ['libya'] });

function countryScore(story, event) {
  if (!story.countries.length) return 0;
  const eventValues = [event.country, event.region, event.title].filter(Boolean).map(value => String(value).toLowerCase());
  return story.countries.some(country => {
    const aliases = [String(country).toLowerCase(), ...(COUNTRY_NAMES[String(country).toUpperCase()] || [])];
    return aliases.some(alias => eventValues.some(value => value.includes(alias)));
  }) ? 1 : 0;
}


function matchScore(story, event) {
  const timeHours = Math.abs(toTimestamp(story.publishedAt) - toTimestamp(event.time)) / HOUR_MS;
  if (timeHours > 72) return 0;
  const category = story.category === event.category ? 1 : 0;
  const title = jaccardSimilarity(tokenSet(`${story.title} ${story.summary}`), tokenSet(`${event.title} ${event.region || ''}`));
  const country = countryScore(story, event);
  const time = Math.max(0, 1 - timeHours / 72);
  return category * 0.38 + title * 0.34 + country * 0.18 + time * 0.1;
}

export function linkStoriesToEvents(stories, events, options = {}) {
  const threshold = options.threshold ?? 0.42;
  const maximumLinks = options.maximumLinks ?? 5;
  const linksByStory = new Map();
  for (const story of stories) {
    const links = events.map(event => ({ event, score: matchScore(story, event) }))
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maximumLinks)
      .map(item => ({ eventId: item.event.id, title: item.event.title, category: item.event.category, time: item.event.time, lat: item.event.lat, lon: item.event.lon, source: item.event.source, confidence: round(clamp(item.score * 100, 0, 100)) }));
    linksByStory.set(story.id, links);
  }
  return linksByStory;
}
