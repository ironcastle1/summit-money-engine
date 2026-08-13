import { fetchJson, fetchText } from '../core/http.js';
export async function runCrypto(source){
  const started=Date.now(); const {json}=await fetchJson(source.url); const labels={bitcoin:'BTC',ethereum:'ETH',solana:'SOL'};
  const markets=Object.entries(json||{}).flatMap(([id,row])=>Number.isFinite(Number(row?.usd))?[{id:`crypto:${id}`,symbol:labels[id]||id.toUpperCase(),name:id,type:'crypto',price:Number(row.usd),change24h:Number(row.usd_24h_change),updatedAt:row.last_updated_at?new Date(Number(row.last_updated_at)*1000).toISOString():new Date().toISOString(),sourceName:source.name}]:[]);
  return {items:[],predictions:[],markets,durationMs:Date.now()-started};
}
export async function runFx(source){
  const started=Date.now(); const {json}=await fetchJson(source.url); const rates=json?.data?.rates||{}; const quotes=['EUR','GBP','JPY','CHF','CAD','AUD','CNY'];
  const markets=quotes.flatMap(q=>Number.isFinite(Number(rates[q]))?[{id:`fx:USD${q}`,symbol:`USD/${q}`,name:`US Dollar / ${q}`,type:'fx',price:Number(rates[q]),updatedAt:new Date().toISOString(),sourceName:source.name}]:[]);
  return {items:[],predictions:[],markets,durationMs:Date.now()-started};
}
export async function runStooq(source){
  const started=Date.now(); const {text}=await fetchText(source.url,{headers:{accept:'text/csv,text/plain,*/*'}}); const lines=text.trim().split(/\r?\n/).filter(Boolean); const cells=(lines.at(-1)||'').split(',').map(x=>x.replace(/^"|"$/g,'').trim());
  const [symbol,date,time,open,high,low,close]=cells; const price=Number(close); const markets=Number.isFinite(price)?[{id:`commodity:${source.symbol}`,symbol:source.symbol,name:source.name.replace(/^Stooq\s+/,''),type:'commodity',price,open:Number(open),high:Number(high),low:Number(low),updatedAt:date?`${date}T${time||'00:00:00'}Z`:new Date().toISOString(),sourceName:source.name}]:[];
  return {items:[],predictions:[],markets,durationMs:Date.now()-started};
}
