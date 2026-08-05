import { confidenceLabel } from './constants.js';
export class ConfidenceModel {
    score(input = {}) {
        const reliability = bounded(input.sourceReliability ?? 50) / 100;
        const corroboration = bounded(input.corroborationScore ?? 0) / 100;
        const completeness = bounded(input.completenessScore ?? 50) / 100;
        const recency = recencyScore(input.timestamp, input.now);
        const specificity = bounded(input.specificityScore ?? 50) / 100;
        const contradiction = bounded(input.contradictionScore ?? 0) / 100;
        const manipulation = bounded(input.manipulationRisk ?? 0) / 100;
        const raw = reliability * 0.25 + corroboration * 0.3 + completeness * 0.14 + recency * 0.12 + specificity * 0.19 - contradiction * 0.27 - manipulation * 0.16;
        const score = Math.round(Math.max(0, Math.min(1, raw)) * 100);
        return { score, label: confidenceLabel(score), factors: { reliability, corroboration, completeness, recency, specificity, contradiction, manipulation } };
    }
}
function bounded(value) { return Math.max(0, Math.min(100, Number(value) || 0)); }
function recencyScore(timestamp, now = Date.now()) {
    const time = Date.parse(timestamp || '');
    if (!Number.isFinite(time))
        return 0.4;
    const hours = Math.max(0, (Number(now) || Date.now()) - time) / 3600000;
    return Math.exp(-hours / 96);
}
