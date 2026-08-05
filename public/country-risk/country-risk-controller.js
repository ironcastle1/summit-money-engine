import {
  createCountryRiskApi
}
from './api-client.js';
import {
  CountryRiskStateStore
}
from './state-store.js';
import {
  riskTable
}
from './risk-table.js';
import {
  countryRiskDetail
}
from './detail-panel.js';
import {
  scenarioPanel
}
from './scenario-panel.js';
import {
  summaryStrip
}
from './summary-strip.js';
import {
  installCountryRiskLayer
}
from './map-layer.js';
export class CountryRiskController{
  constructor(options={
  }){
    this.api=options.api||createCountryRiskApi();
    this.store=options.store||new CountryRiskStateStore();
    this.state=this.store.load();
    this.mapLayer=installCountryRiskLayer(options.map);
    this.snapshot=null;
    this.catalog=null;
    this.active=false;
  }
  async initialize(){
    [this.catalog,
    this.snapshot]=await Promise.all([this.api.catalog(),this.api.snapshot({
      includeNews:true,limit:300
    })]);
    this.mapLayer.set(this.snapshot.features);
    return this;
  }
  async activate(){
    this.active=true;
    if(!this.snapshot)await this.initialize();
    this.render();
  }
  render(filter=''){
    const content=document.querySelector('#sheet-content');
    if(!content)return;
    document.querySelector('#sheet-kicker').textContent='COUNTRY / POLITICS / GOVERNANCE';
    document.querySelector('#sheet-title').textContent='PLACES';
    document.querySelector('#sheet-summary').innerHTML=summaryStrip(this.snapshot.summary);
    content.innerHTML=`<div class="country-risk-layout"><div><div class="country-risk-tools"><input id="country-risk-filter" placeholder="Filter countries" value="${filter}"></div>${riskTable(this.snapshot.profiles,filter)}</div><aside id="country-risk-inspector">${countryRiskDetail(this.selected())}${scenarioPanel(this.catalog)}</aside></div>`;
    content.querySelector('#country-risk-filter')?.addEventListener('input',event=>this.render(event.target.value));
    content.querySelectorAll('[data-country-risk-id]').forEach(button=>button.addEventListener('click',()=>this.select(button.dataset.countryRiskId)));
    content.querySelector('#country-risk-scenario')?.addEventListener('submit',event=>this.runScenario(event));
  }
  selected(){
    return this.snapshot?.profiles?.find(item=>item.country.iso2===this.state.selected)||null;
  }
  async select(id){
    this.state.selected=id;
    this.store.save(this.state);
    const existing=this.selected();
    document.querySelector('#country-risk-inspector').innerHTML=`${countryRiskDetail(existing)}${scenarioPanel(this.catalog)}`;
    document.querySelector('#country-risk-scenario')?.addEventListener('submit',event=>this.runScenario(event));
    if(existing?.country)this.mapLayer.show();
  }
  async runScenario(event){
    event.preventDefault();
    const profile=this.selected();
    if(!profile)return;
    const data=new FormData(event.currentTarget);
    const result=await this.api.scenario({
      countryId:profile.country.iso2,type:data.get('type'),severity:Number(data.get('severity')),horizonDays:Number(data.get('horizonDays')),profile
    });
    const output=document.querySelector('#country-risk-scenario-result');
    if(output)output.textContent=`${result.before} → ${result.after} (${result.delta>=0?'+':''}${result.delta})`;
  }
}
