const KEY='merlin.country-risk.v20';
export class CountryRiskStateStore{
  constructor(storage=globalThis.localStorage){
    this.storage=storage;
  }
  load(){
    try{
      return{
        query:'',
        minimumRisk:0,
        selected:null,
        compare:[],
        ...(JSON.parse(this.storage?.getItem(KEY)||'{}'))
      };
    }
    catch{
      return{
        query:'',
        minimumRisk:0,
        selected:null,
        compare:[]
      };
    }
  }
  save(value){
    try{
      this.storage?.setItem(KEY,JSON.stringify(value));
    }
    catch{
    }
    return value;
  }
}
