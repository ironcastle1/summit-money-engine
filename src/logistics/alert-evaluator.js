import { ALERT_TYPES } from './constants.js';
export function evaluateRouteAlerts(watches = [], snapshots = []) {
  const snapshotByRoute = new Map(snapshots.map(snapshot => [snapshot.routeId || snapshot.id, snapshot])); const alerts = [];
  for (const watch of watches.filter(item => item.enabled !== false)) {
    const snapshot = snapshotByRoute.get(watch.routeId); if (!snapshot) continue; const thresholds = watch.thresholds || {};
    if (Number(snapshot.riskScore || snapshot.metrics?.exposure?.risk?.score || 0) >= Number(thresholds.riskScore || 60)) alerts.push(alert(watch, 'RISK_THRESHOLD', `Risk reached ${snapshot.riskScore || snapshot.metrics?.exposure?.risk?.score}`));
    if (Math.abs(Number(snapshot.etaChangeHours || 0)) >= Number(thresholds.etaChangeHours || 12)) alerts.push(alert(watch, 'ETA_CHANGE', `ETA changed by ${snapshot.etaChangeHours} hours`));
    if (Math.abs(Number(snapshot.costChangePct || 0)) >= Number(thresholds.costChangePct || 15)) alerts.push(alert(watch, 'COST_CHANGE', `Cost changed by ${snapshot.costChangePct}%`));
    if (snapshot.closed) alerts.push(alert(watch, 'ROUTE_CLOSURE', 'Route is closed or blocked'));
  }
  return Object.freeze(alerts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
}
function alert(watch, type, message) { if (!ALERT_TYPES.includes(type)) throw new Error(`Unknown alert type ${type}`); return Object.freeze({ id: `${watch.id}:${type}:${Date.now()}`, watchId: watch.id, routeId: watch.routeId, type, message, severity: ['ROUTE_CLOSURE', 'SANCTIONS_MATCH'].includes(type) ? 'CRITICAL' : 'WARNING', createdAt: new Date().toISOString() }); }
