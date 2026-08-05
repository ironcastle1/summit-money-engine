function csv(value){
  const text=String(value??'');
  return /[",\n]/.test(text)?`"${
    text.replaceAll('"','""')
  }
  "`:text;}
  export class CountryRiskExportService { toCsv(profiles=[]){const rows=[['ISO2','Country','Risk','Band','Confidence','Coverage','Top drivers']];for(const profile of profiles)rows.push([profile.country.iso2,profile.country.name,profile.risk.score,profile.risk.band.id,profile.risk.confidence,profile.risk.coverage,(profile.risk.components||[]).sort((a,b)=>b.score-a.score).slice(0,5).map(item=>item.id).join('|')]);return rows.map(row=>row.map(csv).join(',')).join('\n');} toJson(value){return JSON.stringify(value,null,2);} summary(snapshot){return Object.freeze({generatedAt:snapshot.generatedAt,countries:snapshot.profiles?.length||0,severe:(snapshot.profiles||[]).filter(item=>item.risk.score>=80).length,high:(snapshot.profiles||[]).filter(item=>item.risk.score>=65).length,average:(snapshot.profiles||[]).length?Math.round((snapshot.profiles||[]).reduce((s,p)=>s+p.risk.score,0)/(snapshot.profiles||[]).length*10)/10:0});} }
