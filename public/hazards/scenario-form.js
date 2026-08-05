export class HazardScenarioForm {
  constructor(options) {
    this.root=options.root;
    this.onRun=options.onRun;
    this.render();
  }
  render() {
    this.root.innerHTML=`<form class="hazard-scenario-form"><label>TYPE<select name="type"><option>EARTHQUAKE</option><option>TROPICAL_CYCLONE</option><option>FLOOD</option><option>WILDFIRE</option><option>VOLCANO</option><option>TSUNAMI</option><option>EXTREME_HEAT</option></select></label><label>LATITUDE<input name="lat" type="number" step="0.001" required value="35"></label><label>LONGITUDE<input name="lon" type="number" step="0.001" required value="35"></label><label>SEVERITY<input name="severity" type="range" min="1" max="5" step="0.1" value="4"><output>4</output></label><button type="submit">RUN IMPACT SCENARIO</button></form>`;
    const form=this.root.querySelector('form'), range=form.elements.severity, output=form.querySelector('output');
    range.addEventListener('input', ()=>output.textContent=range.value);
    form.addEventListener('submit', event=> {
      event.preventDefault();
      const data=new FormData(form);
      this.onRun?.( {
        event: {
          type:data.get('type'), category:String(data.get('type')).toLowerCase().replaceAll('_', '-'), title:`${String(data.get('type')).replaceAll('_',' ')} scenario`, lat:Number(data.get('lat')), lon:Number(data.get('lon')), time:new Date().toISOString(), severity:Number(data.get('severity')), attributes: {
            material:true
          }
        }
      });
    });
  }
}
