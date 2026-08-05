export const DEFAULT_ALERT_THRESHOLDS=Object.freeze( {
  WATCH:45, WARNING:60, SEVERE:75, CRITICAL:90
});
export function alertLevel(score, thresholds=DEFAULT_ALERT_THRESHOLDS) {
  const n=Number(score)||0;
  if(n>=thresholds.CRITICAL)return'CRITICAL';
  if(n>=thresholds.SEVERE)return'SEVERE';
  if(n>=thresholds.WARNING)return'WARNING';
  if(n>=thresholds.WATCH)return'WATCH';
  return'INFORMATION';
}
