export function evaluateCountryAlerts(watches = [], profiles = []) {
  const byCode=new Map(profiles.map(profile=>[profile.country.iso2,profile]));
  return Object.freeze(watches.flatMap(watch=>{
    const profile=byCode.get(watch.iso2);
    if(!profile)return[];
    const value=watch.factor==='composite'?profile.risk.score:profile.factors?.[watch.factor]?.score;
    const hit=watch.direction==='BELOW'?value<=watch.threshold:value>=watch.threshold;
    return hit?[Object.freeze({
      id:`country-alert:${watch.id}`,watchId:watch.id,iso2:watch.iso2,country:profile.country.name,factor:watch.factor,value,threshold:watch.threshold,direction:watch.direction,severity:value>=80?'CRITICAL':value>=65?'HIGH':'MEDIUM',generatedAt:new Date().toISOString()
    })]:[];
  }));
}
