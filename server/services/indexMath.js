function clamp(n, a=0, b=100){ return Math.max(a, Math.min(b, n)); }
function hasNumber(n){ return Number.isFinite(Number(n)); }
function scoreHomicide(rate){
  if(!hasNumber(rate)) return null;
  const r = Number(rate);
  if(r <= 0.5) return 96;
  if(r <= 1) return 90;
  if(r <= 2) return 82;
  if(r <= 4) return 70;
  if(r <= 7) return 58;
  if(r <= 10) return 45;
  if(r <= 20) return 28;
  if(r <= 40) return 14;
  return 5;
}
function scoreLocalCrimeCount(count){
  if(!hasNumber(count)) return null;
  const c = Number(count);
  if(c <= 20) return 88;
  if(c <= 50) return 74;
  if(c <= 100) return 58;
  if(c <= 180) return 42;
  if(c <= 300) return 25;
  return 10;
}
function scoreSafety({ crimeIndex, conflict, warCount=0, terrorCount=0, disasterCount=0 }){
  if(crimeIndex === null && !conflict && !warCount && !terrorCount && !disasterCount) return null;
  let s = crimeIndex === null ? 100 : Number(crimeIndex);
  if(conflict) s -= conflict.severity === 'active-war' ? 45 : conflict.severity === 'high-risk' ? 28 : 15;
  s -= Math.min(38, Number(warCount||0) * 5);
  s -= Math.min(28, Number(terrorCount||0) * 7);
  s -= Math.min(18, Number(disasterCount||0) * 3);
  return Math.round(clamp(s));
}
function scoreMoney(national, financeNodes=0, marketEvents=0){
  const gdp = national?.gdpPerCapita?.value;
  const growth = national?.gdpGrowth?.value;
  const trade = national?.tradePctGdp?.value;
  const internet = national?.internetUsersPct?.value;
  if(!hasNumber(gdp) && !hasNumber(growth) && !hasNumber(trade) && !hasNumber(internet) && !marketEvents) return null;
  let s = 0;
  if(hasNumber(gdp)) s += clamp(Math.log10(Math.max(1,gdp)) * 18 - 35, 0, 28);
  if(hasNumber(growth)) s += clamp((Number(growth)+3) * 4, 0, 22);
  if(hasNumber(trade)) s += clamp(Number(trade) / 5, 0, 18);
  if(hasNumber(internet)) s += clamp(Number(internet) / 8, 0, 12);
  s += clamp(marketEvents * 4, 0, 10);
  return Math.round(clamp(s));
}
function indexBand(score){
  if(score === null || score === undefined) return 'N/A';
  const s = Number(score);
  if(s >= 80) return 'strong';
  if(s >= 60) return 'good';
  if(s >= 40) return 'watch';
  if(s >= 20) return 'weak';
  return 'danger';
}
module.exports = { clamp, hasNumber, scoreHomicide, scoreLocalCrimeCount, scoreSafety, scoreMoney, indexBand };
