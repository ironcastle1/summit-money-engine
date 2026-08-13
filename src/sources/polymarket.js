import { fetchJson } from '../core/http.js';
import { stableId } from '../core/hash.js';
export async function runPolymarket(source){
  const started=Date.now(); const {json}=await fetchJson(source.url); const events=Array.isArray(json)?json:[];
  const predictions=[];
  for(const event of events){
    const title=String(event.title||'').trim(); if(!title)continue;
    const markets=Array.isArray(event.markets)?event.markets:[];
    const best=markets.slice().sort((a,b)=>Number(b.volume||0)-Number(a.volume||0))[0];
    const prob=extractYes(best); const volume=Number(event.volume||best?.volume||0); const liquidity=Number(event.liquidity||best?.liquidity||0);
    if(!Number.isFinite(prob)||volume<10_000)continue;
    predictions.push({id:stableId('pm',event.id||event.slug||title),kind:'prediction',title,description:String(event.description||'').slice(0,1200),url:event.slug?`https://polymarket.com/event/${event.slug}`:'https://polymarket.com',probability:prob,volume,liquidity,endDate:event.endDate||null,updatedAt:event.updatedAt||event.published_at||new Date().toISOString(),sourceId:source.id,sourceName:source.name,sourceQuality:0.74});
  }
  return {items:[],markets:[],predictions,durationMs:Date.now()-started};
}
function extractYes(market){
  if(!market)return NaN; const outcomes=parse(market.outcomes); const prices=parse(market.outcomePrices); if(!outcomes.length||outcomes.length!==prices.length)return NaN;
  let i=outcomes.findIndex(x=>String(x).toLowerCase()==='yes'); if(i<0)i=0; const p=Number(prices[i]); return Number.isFinite(p)?p:NaN;
}
function parse(value){ if(Array.isArray(value))return value; if(typeof value==='string'){try{return JSON.parse(value)}catch{return value.split(',').map(x=>x.trim())}} return []; }
