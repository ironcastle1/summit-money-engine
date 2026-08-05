export const RISK_BANDS = Object.freeze([ Object.freeze({
  id: 'LOW', minimum: 0, maximum: 24.99, label: 'Low'
}), Object.freeze({
  id: 'GUARDED', minimum: 25, maximum: 44.99, label: 'Guarded'
}), Object.freeze({
  id: 'ELEVATED', minimum: 45, maximum: 64.99, label: 'Elevated'
}), Object.freeze({
  id: 'HIGH', minimum: 65, maximum: 79.99, label: 'High'
}), Object.freeze({
  id: 'SEVERE', minimum: 80, maximum: 100, label: 'Severe'
}) ]);
export const HORIZONS = Object.freeze(['NOW', '30D', '90D', '1Y']);
export const FACTOR_WEIGHTS = Object.freeze({
  conflict: 0.14, governance: 0.12, stability: 0.10, elections: 0.07, sanctions: 0.09, policy: 0.07, sovereign: 0.08, regulatory: 0.06, humanitarian: 0.07, economic: 0.07, border: 0.05, cyber: 0.03, institutional: 0.05
});
export const EVIDENCE_STATES = Object.freeze(['MEASURED', 'REFERENCE', 'INFERRED', 'UNAVAILABLE']);
