import { createEntity } from './entity-schema.js';
import { sentenceSplit } from './text-normalizer.js';
import { defaultPlaceIndex } from './place-index.js';
const ORGANISATION_SUFFIX = /\b([A-Z][\w&.'’-]*(?:\s+[A-Z][\w&.'’-]*){0,5}\s+(?:Ministry|Department|Agency|Authority|Council|Bank|Group|Corporation|Company|University|Institute|Forces?|Army|Navy|Police|Government|Parliament|Commission|Committee|Organisation|Organization|Union|Front|Movement))\b/g;
const PERSON_PATTERN = /\b(?:President|Prime Minister|Minister|General|Admiral|Governor|Mayor|Dr|Sir)\s+([A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’-]+){0,3})\b/g;
const ASSET_PATTERN = /\b(BTC|Bitcoin|ETH|Ethereum|Brent|WTI|Gold|Silver|S&P 500|Nasdaq|Dow Jones|GBP|USD|EUR|RUB|CNY)\b/gi;
const COMMODITY_PATTERN = /\b(crude oil|natural gas|lng|wheat|corn|maize|rice|copper|iron ore|coal|uranium|fertiliser|fertilizer|container freight|diesel|petrol|gasoline)\b/gi;
const INFRASTRUCTURE_PATTERN = /\b([A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*){0,5}\s+(?:Airport|Port|Terminal|Refinery|Pipeline|Power Station|Power Plant|Bridge|Railway|Dam|Canal|Base|Hospital))\b/g;
export class EntityExtractor {
    constructor(options = {}) { this.places = options.places || defaultPlaceIndex(); }
    extract(record) {
        const text = [record?.title, record?.summary, record?.description, record?.content].filter(Boolean).join('. ');
        const evidence = record?.id ? [record.id] : [];
        const entities = [];
        const seen = new Set();
        const add = input => {
            try {
                const entity = createEntity({ ...input, evidence });
                const key = `${entity.type}:${entity.canonicalName}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    entities.push(entity);
                }
            }
            catch { }
        };
        for (const sentence of sentenceSplit(text)) {
            for (const place of this.#placesInSentence(sentence))
                add({ ...place, type: place.type, name: place.name, aliases: [place.localName, ...(place.aliases || [])].filter(Boolean), coordinate: place, countryCode: place.countryCode || place.iso2, confidence: 88 });
            for (const match of sentence.matchAll(ORGANISATION_SUFFIX))
                add({ type: 'ORGANISATION', name: match[1], confidence: 68 });
            for (const match of sentence.matchAll(PERSON_PATTERN))
                add({ type: 'PERSON', name: match[1], confidence: 64, attributes: { title: match[0].slice(0, match[0].indexOf(match[1])).trim() } });
            for (const match of sentence.matchAll(ASSET_PATTERN))
                add({ type: 'ASSET', name: match[1], confidence: 76 });
            for (const match of sentence.matchAll(COMMODITY_PATTERN))
                add({ type: 'COMMODITY', name: titleCase(match[1]), confidence: 73 });
            for (const match of sentence.matchAll(INFRASTRUCTURE_PATTERN))
                add({ type: 'INFRASTRUCTURE', name: match[1], confidence: 72 });
        }
        for (const supplied of record?.entities || [])
            add(supplied);
        if (record?.coordinate)
            add({ type: 'PLACE', name: record.locationName || 'Reported location', coordinate: record.coordinate, confidence: 72 });
        return entities;
    }
    #placesInSentence(sentence) {
        const lower = sentence.toLocaleLowerCase('en-GB');
        const matches = [];
        for (const place of this.places.places) {
            const names = [place.name, place.localName, ...(place.aliases || [])].filter(Boolean);
            if (names.some(name => lower.includes(String(name).toLocaleLowerCase('en-GB'))))
                matches.push(place);
        }
        return matches;
    }
}
function titleCase(value) { return String(value).replace(/\b\w/g, char => char.toUpperCase()); }
