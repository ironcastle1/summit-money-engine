import { DEFAULT_THRESHOLDS } from './constants.js';
export class EarthquakePolicy {
    constructor(options = {}) { this.major = options.majorMagnitude ?? DEFAULT_THRESHOLDS.majorEarthquakeMagnitude; this.populated = options.populatedMagnitude ?? DEFAULT_THRESHOLDS.populatedEarthquakeMagnitude; this.tsunami = options.tsunamiMagnitude ?? DEFAULT_THRESHOLDS.tsunamiEarthquakeMagnitude; }
    applies(event) { return String(event?.category || event?.type || '').toLowerCase().includes('earthquake') || Number.isFinite(Number(event?.magnitude)); }
    evaluate(event) {
        if (!this.applies(event))
            return { applies: false, show: true, material: null, reasons: [] };
        const magnitude = Number(event?.magnitude ?? event?.attributes?.magnitude ?? 0);
        const reasons = [];
        let show = false;
        if (magnitude >= this.major) {
            show = true;
            reasons.push(`magnitude ${magnitude.toFixed(1)} major earthquake`);
        }
        if (magnitude >= this.populated && (event?.nearPopulation || Number(event?.populationExposed) > 100000)) {
            show = true;
            reasons.push('populated area exposed');
        }
        if (magnitude >= this.tsunami || event?.tsunami || event?.attributes?.tsunami) {
            show = true;
            reasons.push('tsunami potential or warning');
        }
        if (event?.strategicAsset || event?.shippingImpact || event?.portImpact) {
            show = true;
            reasons.push('strategic or shipping asset affected');
        }
        if (event?.infrastructureOutage || event?.nationalImpact) {
            show = true;
            reasons.push('major infrastructure or national impact');
        }
        if (Number(event?.deaths) > 0 || Number(event?.injured) >= 20 || Number(event?.displaced) >= 1000) {
            show = true;
            reasons.push('material human impact');
        }
        const depth = Number(event?.depthKm ?? event?.attributes?.depthKm);
        if (magnitude >= 6 && Number.isFinite(depth) && depth <= 25 && event?.nearPopulation) {
            show = true;
            reasons.push('shallow earthquake near population');
        }
        return { applies: true, show, material: show, magnitude, reasons, filteredReason: show ? null : 'routine earthquake below material-impact thresholds' };
    }
}
