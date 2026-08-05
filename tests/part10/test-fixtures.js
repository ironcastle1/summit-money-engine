export const country={
  id:'gb',
  iso2:'GB',
  iso3:'GBR',
  name:'United Kingdom',
  nativeName:'United Kingdom',
  region:'Europe',
  subregion:'Northern Europe',
  lat:54,
  lon:-2,
  aliases:['Britain',
  'UK']
};
export const events=[{
  id:'e1',
  category:'protest',
  title:'National protest expands',
  severity:55,
  time:new Date().toISOString(),
  countries:['GB'],
  source:'source-a'
},
{
  id:'e2',
  category:'cyber',
  title:'Cyber disruption affects public services',
  severity:45,
  time:new Date().toISOString(),
  countries:['GB'],
  source:'source-b'
}];
export const profileInput={
  country,
  events,
  indicators:{
    politicalStability:55,
    ruleOfLaw:72,
    governmentEffectiveness:70,
    controlOfCorruption:68,
    regulatoryQuality:74,
    debtToGdp:92,
    fiscalDeficit:5,
    inflation:6,
    currencyChange90d:-4
  },
  elections:[{
    id:'el1',
    date:new Date(Date.now()+45*86400000).toISOString(),
    contestationRisk:20
  }],
  sanctions:[],
  sources:{
  }
};
