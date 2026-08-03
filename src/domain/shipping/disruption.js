import { clamp, round, mean } from '../../core/numbers.js';
import { DISRUPTION_CATEGORIES, RISK_BANDS } from './constants.js';
import { haversineKm } from '../geo/distance.js';
import { entityMentionScore } from './text-match.js';

function ageHours(timestamp, now = Date.now()) { return Math.max(0, (now - new Date(timestamp).getTime()) / 3_600_000); }
function decay(hours, halfLife) { return 2 ** (-hours / halfLife); }
function eventSeverity(event) { const value = Number(event.severity ?? event.score ?? 0); return clamp(value <= 5 ? value * 20 : value, 0, 100); }
function band(score) { return RISK_BANDS.find(item => score >= item.min)?.id || 'LOW'; }

export function scoreEventEvidence(node, events, options = {}) {
  const radiusKm = options.radiusKm || node.radiusKm || (node.type === 'energy' ? 180 : 120);
  const now = options.now || Date.now();
  const matches = [];
  for (const event of events || []) {
    if (!Number.isFinite(event.lat) || !Number.isFinite(event.lon) || !DISRUPTION_CATEGORIES.has(String(event.category || '').toLowerCase())) continue;
    const distanceKm = haversineKm(node.coordinates.lat, node.coordinates.lon, event.lat, event.lon);
    if (distanceKm > radiusKm) continue;
    const age = ageHours(event.time || event.timestamp || event.occurredAt || event.updatedAt, now);
    const proximity = Math.max(0, 1 - distanceKm / radiusKm);
    const categoryWeight = ['conflict', 'terror', 'transport', 'infrastructure'].includes(event.category) ? 1 : 0.78;
    const contribution = eventSeverity(event) * (0.35 + proximity * 0.65) * decay(age, 36) * categoryWeight;
    matches.push({ id: event.id, title: event.title, category: event.category, severity: eventSeverity(event), distanceKm: round(distanceKm, 1), ageHours: round(age, 1), contribution: round(contribution, 1), timestamp: event.time || event.timestamp });
  }
  matches.sort((a, b) => b.contribution - a.contribution);
  const total = matches.reduce((sum, item) => sum + item.contribution, 0);
  return { score: round(clamp(100 * (1 - Math.exp(-total / 115)), 0, 100), 1), count: matches.length, evidence: matches.slice(0, 20) };
}

export function scoreNewsEvidence(node, stories, options = {}) {
  const now = options.now || Date.now();
  const entities = [node.name, node.country, node.unlocode, ...(node.commodities || [])].filter(Boolean);
  const evidence = [];
  for (const story of stories || []) {
    const text = `${story.title || ''} ${story.summary || ''} ${(story.entities || []).join(' ')} ${(story.countries || []).join(' ')}`;
    const mention = entityMentionScore(text, entities);
    if (!mention.matched.length) continue;
    const age = ageHours(story.latestAt || story.publishedAt, now);
    const verification = clamp(Number(story.verificationScore || 0), 0, 100);
    const velocity = clamp(Number(story.velocity?.index || story.velocityIndex || 0), 0, 100);
    const contribution = (mention.score * 0.35 + verification * 0.45 + velocity * 0.20) * decay(age, 30);
    evidence.push({ id: story.id, title: story.title, verification, velocity, ageHours: round(age, 1), matched: mention.matched, contribution: round(contribution, 1), latestAt: story.latestAt || story.publishedAt });
  }
  evidence.sort((a, b) => b.contribution - a.contribution);
  const top = evidence.slice(0, 12);
  return { score: round(clamp(100 * (1 - Math.exp(-top.reduce((sum, item) => sum + item.contribution, 0) / 145)), 0, 100), 1), count: evidence.length, evidence: top };
}

export function combineDisruptionRisk(input) {
  const eventScore = Number(input.event?.score || 0);
  const newsScore = Number(input.news?.score || 0);
  const operationalScore = Number.isFinite(input.operational?.score) ? input.operational.score : null;
  const sourceCoverage = [input.event?.count > 0, input.news?.count > 0, Number.isFinite(operationalScore)].filter(Boolean).length;
  const weights = operationalScore === null ? { event: 0.62, news: 0.38, operational: 0 } : { event: 0.42, news: 0.28, operational: 0.30 };
  const raw = eventScore * weights.event + newsScore * weights.news + (operationalScore || 0) * weights.operational;
  const importanceAmplifier = 0.85 + clamp(Number(input.importance || 50), 0, 100) / 100 * 0.15;
  const score = round(clamp(raw * importanceAmplifier, 0, 100), 1);
  const evidenceCount = Number(input.event?.count || 0) + Number(input.news?.count || 0) + Number(input.operational?.sampleSize || 0);
  const confidence = evidenceCount < 2 ? null : round(clamp(25 + Math.log2(evidenceCount + 1) * 13 + sourceCoverage * 9, 0, 96), 1);
  return { score, band: band(score), confidence, evidenceCount, sourceCoverage, components: { event: eventScore, news: newsScore, operational: operationalScore } };
}

export function aggregateNetworkRisk(items) {
  const scored = items.filter(item => Number.isFinite(item.risk?.score));
  if (!scored.length) return { mean: null, weighted: null, maximum: null, criticalCount: 0, highCount: 0 };
  const importanceTotal = scored.reduce((sum, item) => sum + Math.max(1, item.importance || 1), 0);
  return {
    mean: round(mean(scored.map(item => item.risk.score)), 1),
    weighted: round(scored.reduce((sum, item) => sum + item.risk.score * Math.max(1, item.importance || 1), 0) / importanceTotal, 1),
    maximum: round(Math.max(...scored.map(item => item.risk.score)), 1),
    criticalCount: scored.filter(item => item.risk.score >= 80).length,
    highCount: scored.filter(item => item.risk.score >= 60).length
  };
}
