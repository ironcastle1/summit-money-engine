import { clamp, round } from '../../core/numbers.js';

function sourceScore(sourceCount) {
  if (!Number.isFinite(sourceCount)) return 0;
  if (sourceCount >= 4) return 100;
  if (sourceCount === 3) return 82;
  if (sourceCount === 2) return 62;
  if (sourceCount === 1) return 38;
  return 0;
}

function sampleScore(sampleSize, target = 60) {
  if (!Number.isFinite(sampleSize) || sampleSize <= 0) return 0;
  return clamp(100 * Math.log1p(sampleSize) / Math.log1p(target), 0, 100);
}

function freshnessScore(ageMinutes, maximumUsefulMinutes = 1440) {
  if (!Number.isFinite(ageMinutes) || ageMinutes < 0) return 0;
  return clamp(100 * (1 - ageMinutes / maximumUsefulMinutes), 0, 100);
}

function coverageScore(coverage) {
  if (!Number.isFinite(coverage)) return 0;
  return clamp(coverage <= 1 ? coverage * 100 : coverage, 0, 100);
}

function intervalScore(width) {
  if (!Number.isFinite(width) || width < 0) return 0;
  return clamp(100 - width * 125, 0, 100);
}

export function evidenceScore(input = {}) {
  const components = [
    { name: 'sources', value: sourceScore(input.sourceCount), weight: 0.2 },
    { name: 'sample', value: sampleScore(input.sampleSize, input.sampleTarget || 60), weight: 0.24 },
    { name: 'freshness', value: freshnessScore(input.ageMinutes, input.maximumUsefulMinutes || 1440), weight: 0.18 },
    { name: 'coverage', value: coverageScore(input.coverage), weight: 0.2 },
    { name: 'interval', value: intervalScore(input.intervalWidth), weight: 0.18 }
  ];
  const active = components.filter(item => Number.isFinite(item.value));
  if (active.length < 3) return { available: false, score: null, grade: 'N/A', components: [] };
  const totalWeight = active.reduce((sum, item) => sum + item.weight, 0);
  const score = active.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
  let grade = 'D';
  if (score >= 82) grade = 'A';
  else if (score >= 68) grade = 'B';
  else if (score >= 52) grade = 'C';
  return {
    available: true,
    score: round(score, 1),
    grade,
    components: active.map(item => ({ name: item.name, score: round(item.value, 1), weight: item.weight }))
  };
}

export function combineEvidence(evidenceItems = []) {
  const usable = evidenceItems.filter(item => item?.available && Number.isFinite(item.score));
  if (!usable.length) return { available: false, score: null, grade: 'N/A', count: 0 };
  const sorted = [...usable].sort((a, b) => b.score - a.score);
  const weights = sorted.map((_, index) => 1 / (1 + index * 0.45));
  const score = sorted.reduce((sum, item, index) => sum + item.score * weights[index], 0) / weights.reduce((a, b) => a + b, 0);
  let grade = 'D';
  if (score >= 82) grade = 'A';
  else if (score >= 68) grade = 'B';
  else if (score >= 52) grade = 'C';
  return { available: true, score: round(score, 1), grade, count: usable.length };
}
