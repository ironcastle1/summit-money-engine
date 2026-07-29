const COUNTRY_BASELINES = {
  syria: { risk: 68, label: 'high caution', reason: 'country baseline: recent/ongoing conflict and travel-risk context' },
  ukraine: { risk: 72, label: 'high caution', reason: 'country baseline: active war context' },
  palestine: { risk: 78, label: 'avoid unless essential', reason: 'country baseline: active conflict context' },
  'palestinian territories': { risk: 78, label: 'avoid unless essential', reason: 'country baseline: active conflict context' },
  israel: { risk: 48, label: 'caution', reason: 'country baseline: conflict and security context' },
  lebanon: { risk: 55, label: 'caution', reason: 'country baseline: regional security context' },
  yemen: { risk: 80, label: 'avoid unless essential', reason: 'country baseline: active conflict and humanitarian risk context' },
  sudan: { risk: 82, label: 'avoid unless essential', reason: 'country baseline: active conflict and humanitarian risk context' },
  somalia: { risk: 76, label: 'avoid unless essential', reason: 'country baseline: security risk context' },
  russia: { risk: 45, label: 'caution', reason: 'country baseline: war, sanctions and political-risk context' },
  iran: { risk: 52, label: 'caution', reason: 'country baseline: sanctions and security context' },
  iraq: { risk: 55, label: 'caution', reason: 'country baseline: security risk context' },
  afghanistan: { risk: 82, label: 'avoid unless essential', reason: 'country baseline: security and governance risk context' },
  haiti: { risk: 75, label: 'avoid unless essential', reason: 'country baseline: security risk context' },
  mali: { risk: 70, label: 'high caution', reason: 'country baseline: conflict and security risk context' },
  niger: { risk: 60, label: 'high caution', reason: 'country baseline: political/security risk context' },
  'burkina faso': { risk: 72, label: 'high caution', reason: 'country baseline: conflict/security risk context' }
};

function baselineFor(country) {
  const key = String(country || '').toLowerCase().trim();
  return COUNTRY_BASELINES[key] || { risk: 22, label: 'normal baseline', reason: 'no special country baseline loaded' };
}

module.exports = { baselineFor, COUNTRY_BASELINES };
