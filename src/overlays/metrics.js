export class OverlayMetrics {
  constructor() { this.counters = new Map(); this.timings = new Map(); }
  increment(name, value=1) { this.counters.set(name,(this.counters.get(name)||0)+Number(value||0)); }
  observe(name, milliseconds) { const list=this.timings.get(name)||[]; list.push(Number(milliseconds)||0); if(list.length>1000) list.shift(); this.timings.set(name,list); }
  snapshot() { const timing={}; for(const [name,values] of this.timings){ const sorted=[...values].sort((a,b)=>a-b); timing[name]={count:values.length,average:values.length?values.reduce((a,b)=>a+b,0)/values.length:0,p95:sorted[Math.floor(sorted.length*.95)]||0}; } return Object.freeze({counters:Object.freeze(Object.fromEntries(this.counters)),timings:Object.freeze(timing)}); }
}
