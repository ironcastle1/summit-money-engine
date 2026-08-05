function text(event){
  return `${event.title||''} ${event.summary||''} ${(event.countries||[]).join(' ')}`.toLowerCase();
}
export function linkEventsToCountry(country, events = []) {
  const aliases=[country.name,
  country.nativeName,
  country.iso2,
  country.iso3,
  ...(country.aliases||[])].filter(Boolean).map(value=>String(value).toLowerCase());
  return Object.freeze(events.filter(event=>{
    const codes=(event.countries||[]).map(value=>String(value).toUpperCase());
    if(codes.includes(country.iso2)||codes.includes(country.iso3)) return true;
    const value=text(event);
    return aliases.some(alias=>alias.length>3&&value.includes(alias));
  }).slice(0,500));
}
