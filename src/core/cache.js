export class TTLCache {
  #rows=new Map();
  get(key){ const row=this.#rows.get(key); if(!row)return null; if(row.expiresAt<Date.now()){this.#rows.delete(key);return null;} return row.value; }
  set(key,value,ttlMs){ this.#rows.set(key,{value,expiresAt:Date.now()+ttlMs}); return value; }
  delete(key){ this.#rows.delete(key); }
  clear(){ this.#rows.clear(); }
}
