export function summaryStrip(summary={
}){
  return `<div class="country-risk-summary"><div><span>COUNTRIES</span><b>${summary.countries||0}</b></div><div><span>HIGH</span><b>${summary.high||0}</b></div><div><span>SEVERE</span><b>${summary.severe||0}</b></div><div><span>AVERAGE</span><b>${Number(summary.average||0).toFixed(1)}</b></div></div>`;
}
