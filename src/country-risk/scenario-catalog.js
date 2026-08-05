export const COUNTRY_SCENARIOS = Object.freeze([ Object.freeze({
  id:'ELECTION_DISPUTE',label:'Disputed election',factors:{
    elections:25,stability:18,protests:20,policy:8
  }
}), Object.freeze({
  id:'SANCTIONS_ESCALATION',label:'Sanctions escalation',factors:{
    sanctions:30,economic:12,sovereign:10,trade:18
  }
}), Object.freeze({
  id:'BORDER_CLOSURE',label:'Border closure',factors:{
    border:35,trade:15,humanitarian:12,conflict:8
  }
}), Object.freeze({
  id:'COUP_ATTEMPT',label:'Coup attempt',factors:{
    stability:40,securitySector:35,governance:20,policy:20
  }
}), Object.freeze({
  id:'CURRENCY_CRISIS',label:'Currency crisis',factors:{
    currency:40,sovereign:25,fiscal:18,economic:20
  }
}), Object.freeze({
  id:'POLICY_SHOCK',label:'Abrupt policy change',factors:{
    policy:30,regulatory:25,investment:18,economic:10
  }
}), Object.freeze({
  id:'DEESCALATION',label:'Political de-escalation',factors:{
    conflict:-20,stability:-15,policy:-8,investment:-10
  }
}) ]);
export function scenarioDefinition(id){
  return COUNTRY_SCENARIOS.find(item=>item.id===String(id||'').toUpperCase())||COUNTRY_SCENARIOS.find(item=>item.id==='POLICY_SHOCK');
}
