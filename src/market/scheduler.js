import { runMarketResearch } from './research.js';
import { localAiStatus } from '../local-ai/client.js';
function meta(db,key){return db.prepare('SELECT value FROM meta WHERE key=?').get(key)?.value||null;}
function setMeta(db,key,value){db.prepare(`INSERT INTO meta (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(key,String(value));}
export async function marketResearchStatus(db){
  const observations=db.prepare('SELECT COUNT(*) n FROM market_observations').get().n;
  const evidence=db.prepare('SELECT COUNT(*) n FROM collected_market_items').get().n;
  const ai=await localAiStatus(db);
  return {enabled:process.env.MERLIN_AUTO_RESEARCH!=='false',observation_count:Number(observations||0),evidence_count:Number(evidence||0),last_run_at:meta(db,'last_market_research_at'),last_status:meta(db,'last_market_research_status'),last_error:meta(db,'last_market_research_error'),analysis_error:meta(db,'last_market_analysis_error'),local_ai:ai};
}
async function maybeRun(db){
  if(process.env.MERLIN_AUTO_RESEARCH==='false')return;
  if(db.prepare("SELECT id FROM market_scan_runs WHERE status='running' AND datetime(started_at)>datetime('now','-2 hours') ORDER BY started_at DESC LIMIT 1").get())return;
  const hours=Math.max(1,Number(process.env.MERLIN_RESEARCH_INTERVAL_HOURS||12));
  const last=meta(db,'last_market_research_at'); if(last&&Date.now()-new Date(last).getTime()<hours*3600_000)return;
  try{setMeta(db,'last_market_research_status','running');await runMarketResearch(db,null);setMeta(db,'last_market_research_error','');}
  catch(err){console.error('MERLIN local market research failed:',err);setMeta(db,'last_market_research_status','failed');setMeta(db,'last_market_research_error',err?.message||String(err));}
}
export function startMarketResearchScheduler(db){
  if(process.env.MERLIN_AUTO_RESEARCH==='false')return;
  setTimeout(()=>maybeRun(db),15_000).unref?.();
  const ms=Math.max(1,Number(process.env.MERLIN_RESEARCH_INTERVAL_HOURS||12))*3600_000;
  const timer=setInterval(()=>maybeRun(db),ms);timer.unref?.();
}
