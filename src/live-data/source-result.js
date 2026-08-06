export function sourceResult(input={}){
  const records=Array.isArray(input.records)?input.records:[];
  return Object.freeze({
    sourceId:String(input.sourceId||''),state:String(input.state||'ONLINE'),records:Object.freeze(records),recordCount:records.length,
    generatedAt:input.generatedAt||new Date().toISOString(),observedAt:input.observedAt||input.generatedAt||new Date().toISOString(),
    durationMs:Number(input.durationMs)||0,cache:String(input.cache||'MISS'),stale:Boolean(input.stale),
    errorCode:input.errorCode||null,errorMessage:input.errorMessage||null,metadata:Object.freeze({...input.metadata})
  });
}
