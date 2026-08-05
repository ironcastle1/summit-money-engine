export class WorldBankCoreConnector{
  constructor(options){this.source=options.source;this.countries=options.countries||[];this.concurrency=Math.max(1,Math.min(5,Number(options.concurrency)||3));}
  async fetch(){const queue=[...this.countries];const records=[];const workers=Array.from({length:Math.min(this.concurrency,queue.length)},async()=>{while(queue.length){const code=queue.shift();const result=await this.source.countryIndicators(code);if(result?.data)records.push({countryCode:code,...result.data});}});await Promise.all(workers);if(!records.length)throw Object.assign(new Error('World Bank returned no country indicators'),{code:'WORLD_BANK_NO_DATA'});return{records,observedAt:new Date().toISOString(),metadata:{countries:records.length}};}
}
