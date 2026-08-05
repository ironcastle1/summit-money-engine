export class OverlayProviderRegistry {
  constructor() { this.providers=new Map(); }
  register(source,provider){ if(!source||typeof provider!=='function') throw new TypeError('Overlay provider requires source and function'); this.providers.set(String(source),provider); return this; }
  has(source){ return this.providers.has(String(source)); }
  async load(task,context={}){ const provider=this.providers.get(task.layer.source); if(!provider) return {records:[],generatedAt:new Date().toISOString(),source:'UNAVAILABLE',mode:'connector_required'}; return provider(task,context); }
  list(){ return [...this.providers.keys()].sort(); }
}
