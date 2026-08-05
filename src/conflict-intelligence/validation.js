export function normalizedConflictRequest(input = {
}) {
  return Object.freeze({
    hours: Math.max(6,
    Math.min(2160,
    Number(input.hours) || 336)),
    limit: Math.max(1,
    Math.min(250,
    Number(input.limit) || 100)),
    minimumRisk: Math.max(0,
    Math.min(100,
    Number(input.minimumRisk) || 0)),
    query: String(input.query || '').trim().slice(0,
    160),
    country: String(input.country || '').trim().slice(0,
    100),
    force: Boolean(input.force)
  });
}
export function normalizedConflictScenario(input = {
}) {
  const theatreId = String(input.theatreId || input.id || '').trim();
  if (!theatreId)
  throw Object.assign(new Error('theatreId is required'),
  {
    code: 'VALIDATION_ERROR',
    statusCode: 400
  });
  return Object.freeze({
    theatreId,
    type: String(input.type || input.scenarioId || '').toUpperCase(),
    severity: Math.max(0,
    Math.min(100,
    Number(input.severity) || 50)),
    horizonDays: Math.max(1,
    Math.min(365,
    Number(input.horizonDays) || 30))
  });
}
