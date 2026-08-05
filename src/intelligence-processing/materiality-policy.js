import { materialityLevel, DEFAULT_THRESHOLDS } from './constants.js';
export class MaterialityPolicy {
    constructor(options = {}) { this.materialThreshold = options.materialThreshold ?? DEFAULT_THRESHOLDS.materialScore; this.criticalThreshold = options.criticalThreshold ?? DEFAULT_THRESHOLDS.criticalScore; }
    evaluate(event, impact = { domains: [] }) {
        const reasons = [];
        let score = 0;
        const confidence = Number(event?.confidence?.score ?? event?.confidence ?? 50);
        score += confidence * 0.16;
        const severity = Number(event?.severity ?? 0);
        score += Math.min(18, severity * 0.18);
        const domains = impact.domains || [];
        score += Math.min(22, domains.reduce((sum, item) => sum + (item.score || 0) * (item.weight || 1), 0) / 35);
        const deaths = Number(event?.deaths ?? event?.attributes?.deaths ?? 0);
        const injured = Number(event?.injured ?? event?.attributes?.injured ?? 0);
        const displaced = Number(event?.displaced ?? event?.attributes?.displaced ?? 0);
        if (deaths > 0) {
            const add = Math.min(25, 5 + Math.log10(deaths + 1) * 8);
            score += add;
            reasons.push(`${deaths} reported deaths`);
        }
        if (injured >= 20) {
            score += Math.min(12, Math.log10(injured + 1) * 4);
            reasons.push('significant injuries');
        }
        if (displaced >= 1000) {
            score += Math.min(14, Math.log10(displaced) * 3);
            reasons.push('large displacement');
        }
        if (event?.nationalImpact || event?.attributes?.nationalImpact) {
            score += 18;
            reasons.push('national impact');
        }
        if (event?.crossBorderImpact || event?.attributes?.crossBorderImpact) {
            score += 13;
            reasons.push('cross-border impact');
        }
        if (event?.strategicAsset || event?.attributes?.strategicAsset) {
            score += 18;
            reasons.push('strategic asset affected');
        }
        if (event?.shippingImpact || event?.attributes?.shippingImpact) {
            score += 15;
            reasons.push('shipping impact');
        }
        if (event?.marketImpact || event?.attributes?.marketImpact) {
            score += 10;
            reasons.push('market impact');
        }
        if (event?.infrastructureOutage || event?.attributes?.infrastructureOutage) {
            score += 13;
            reasons.push('infrastructure outage');
        }
        const sourceCount = Number(event?.confidence?.independentSourceCount ?? event?.independentSourceCount ?? 0);
        if (sourceCount >= 2) {
            score += Math.min(8, sourceCount * 2);
            reasons.push('independently corroborated');
        }
        score = Math.round(Math.max(0, Math.min(100, score)));
        const level = materialityLevel(score);
        return { score, level, material: score >= this.materialThreshold, critical: score >= this.criticalThreshold, reasons: [...new Set(reasons)], domains: domains.map(item => item.domain) };
    }
}
