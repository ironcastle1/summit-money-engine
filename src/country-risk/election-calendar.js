export function buildElectionCalendar(countries = [], elections = [], now = Date.now()) {
  const names = new Map(countries.map(country => [country.iso2, country.name]));
  return Object.freeze(elections.map(item => {
    const time = new Date(item.date).getTime();
    return Object.freeze({
      ...item, countryName:names.get(String(item.countryCode||'').toUpperCase())||item.countryName||null, daysUntil:Number.isFinite(time)?Math.round((time-now)/86400000):null, phase:Number.isFinite(time)&&time<now?'COMPLETED':Number.isFinite(time)&&time-now<30*86400000?'IMMINENT':'UPCOMING'
    });
  }).sort((a,b)=>new Date(a.date)-new Date(b.date)));
}
