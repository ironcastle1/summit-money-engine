import {
  clamp,
  round
}
from './numbers.js';
export function forecastRisk(current, trend = {
}, horizonDays = 30, shocks = []) {
  const days=Math.max(1,Math.min(365,Number(horizonDays)||30));
  const trendMove=(Number(trend.slopePerDay)||0)*days;
  const shockMove=(shocks||[]).reduce((sum,item)=>sum+(Number(item.impact)||0)*Math.exp(-Math.max(0,Number(item.daysUntil)||0)/Math.max(1,days)),0);
  const central=clamp(Number(current)||0+trendMove+shockMove);
  const uncertainty=Math.min(35,8+days/12+(100-Number(trend.confidence||60))*0.12);
  return Object.freeze({
    horizonDays:days,central:round(central,1),low:round(clamp(central-uncertainty),1),high:round(clamp(central+uncertainty),1),drivers:Object.freeze({
      trendMove:round(trendMove,1),shockMove:round(shockMove,1),uncertainty:round(uncertainty,1)
    })
  });
}
