export class CountryRiskWatchlist {
  constructor(options={
  }){
    this.maximum=Number(options.maximum)||250;
    this.items=new Map();
  }
  key(owner){
    return String(owner||'anonymous');
  }
  async list(owner){
    return Object.freeze([...(this.items.get(this.key(owner))||[])].map(item=>Object.freeze({
      ...item
    })));
  }
  async add(owner,input={
  }){
    const key=this.key(owner),
    items=[...(this.items.get(key)||[])];
    const iso2=String(input.iso2||input.countryId||'').toUpperCase();
    if(!iso2)throw new TypeError('iso2 is required');
    const item=Object.freeze({
      id:String(input.id||`${iso2}:${Date.now()}`),iso2,threshold:Number(input.threshold??65),factor:input.factor||'composite',direction:input.direction||'ABOVE',createdAt:new Date().toISOString()
    });
    const next=[item,
    ...items.filter(existing=>existing.iso2!==iso2||existing.factor!==item.factor)].slice(0,this.maximum);
    this.items.set(key,next);
    return item;
  }
  async remove(owner,id){
    const key=this.key(owner),
    items=[...(this.items.get(key)||[])],
    next=items.filter(item=>item.id!==id);
    this.items.set(key,next);
    return next.length!==items.length;
  }
}
