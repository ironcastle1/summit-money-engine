export function scenarioPanel(catalog={
}){
  return `<form class="country-risk-scenario" id="country-risk-scenario"><label>SCENARIO<select name="type">${(catalog.scenarios||[]).map(item=>`<option value="${item.id}">${
    item.label
  }
  </option>`).join('')}</select></label><label>SEVERITY<input name="severity" type="range" min="0" max="100" value="50"></label><label>HORIZON<select name="horizonDays"><option value="30">30 days</option><option value="90" selected>90 days</option><option value="365">1 year</option></select></label><button type="submit">RUN SCENARIO</button><output id="country-risk-scenario-result"></output></form>`;
}
