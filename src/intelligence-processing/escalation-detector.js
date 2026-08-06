const ESCALATION_STATUS = new Set(['ESCALATING', 'ONGOING']);
export class EscalationDetector {
    evaluate(current = {}, previous = null) {
        if (!previous)
            return { escalating: false, score: 0, reasons: [], deltas: {} };
        const reasons = [];
        const deltas = {
            materiality: scoreOf(current.materiality) - scoreOf(previous.materiality),
            confidence: scoreOf(current.confidence) - scoreOf(previous.confidence),
            deaths: number(current.deaths) - number(previous.deaths),
            injured: number(current.injured) - number(previous.injured),
            displaced: number(current.displaced) - number(previous.displaced),
            sources: (current.sourceIds?.length || 0) - (previous.sourceIds?.length || 0),
            impactDomains: (current.impact?.domains?.length || 0) - (previous.impact?.domains?.length || 0)
        };
        let score = 0;
        if (deltas.materiality >= 10) {
            score += Math.min(30, deltas.materiality);
            reasons.push('materiality increased');
        }
        if (deltas.deaths > 0) {
            score += Math.min(25, 5 + Math.log10(deltas.deaths + 1) * 8);
            reasons.push('reported deaths increased');
        }
        if (deltas.injured >= 20) {
            score += Math.min(15, Math.log10(deltas.injured + 1) * 5);
            reasons.push('reported injuries increased');
        }
        if (deltas.displaced >= 1000) {
            score += Math.min(15, Math.log10(deltas.displaced) * 4);
            reasons.push('displacement increased');
        }
        if (deltas.impactDomains > 0) {
            score += Math.min(12, deltas.impactDomains * 4);
            reasons.push('impact spread to additional domains');
        }
        if (current.status === 'ESCALATING' && previous.status !== 'ESCALATING') {
            score += 18;
            reasons.push('status changed to escalating');
        }
        if (current.crossBorderImpact && !previous.crossBorderImpact) {
            score += 15;
            reasons.push('cross-border impact emerged');
        }
        const recencyHours = hoursBetween(current.updatedAt || current.timestamp, previous.updatedAt || previous.timestamp);
        if (recencyHours !== null && recencyHours <= 6)
            score += 5;
        score = Math.round(Math.min(100, score));
        return {
            escalating: score >= 35 || ESCALATION_STATUS.has(current.status) && score >= 20,
            score,
            level: score >= 70 ? 'SEVERE' : score >= 50 ? 'HIGH' : score >= 35 ? 'MODERATE' : 'LOW',
            reasons,
            deltas,
            observedHours: recencyHours
        };
    }
}
function scoreOf(value) {
    return number(value?.score ?? value);
}
function number(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
}
function hoursBetween(left, right) {
    const a = Date.parse(left || '');
    const b = Date.parse(right || '');
    return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) / 3600000 : null;
}
