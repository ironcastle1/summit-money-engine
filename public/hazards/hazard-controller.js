import {
  HazardApiClient
}
from './api-client.js';
import {
  HazardStateStore
}
from './state-store.js';
import {
  HazardLayer
}
from './hazard-layer.js';
import {
  HazardLiveList
}
from './live-list.js';
import {
  HazardDetailPanel
}
from './detail-panel.js';
import {
  HazardScenarioForm
}
from './scenario-form.js';
import {
  HazardScenarioResult
}
from './scenario-result.js';
import {
  HazardWatchlistPanel
}
from './watchlist-panel.js';
export class HazardController {
  constructor(options) {
    this.map=options.map;
    this.api=options.api||new HazardApiClient();
    this.root=options.root;
    this.store=new HazardStateStore();
    this.layer=new HazardLayer(this.map);
    this.build();
    this.store.subscribe(state=>this.reflect(state));
  }
  build() {
    this.root.innerHTML=`<header><div><b>HAZARD IMPACT</b><small>Material operational hazards only</small></div><button data-close>×</button></header><nav><button data-tab="LIVE" class="active">LIVE</button><button data-tab="SCENARIO">SCENARIO</button><button data-tab="WATCHLIST">WATCHLIST</button></nav><section data-pane="LIVE"><div class="hazard-toolbar"><select data-window><option value="24">24 HOURS</option><option value="168" selected>7 DAYS</option><option value="336">14 DAYS</option></select><button data-refresh>REFRESH</button></div><div class="hazard-live-grid"><div data-list></div><div data-detail></div></div></section><section data-pane="SCENARIO" hidden><div data-scenario-form></div><div data-scenario-result></div></section><section data-pane="WATCHLIST" hidden><div data-watchlist></div></section><div data-status></div>`;
    this.live=new HazardLiveList( {
      root:this.root.querySelector('[data-list]'), onSelect:id=>this.select(id)
    });
    this.detail=new HazardDetailPanel(this.root.querySelector('[data-detail]'));
    this.scenarioForm=new HazardScenarioForm( {
      root:this.root.querySelector('[data-scenario-form]'), onRun:payload=>this.runScenario(payload)
    });
    this.scenarioResult=new HazardScenarioResult(this.root.querySelector('[data-scenario-result]'));
    this.watches=new HazardWatchlistPanel( {
      root:this.root.querySelector('[data-watchlist]'), api:this.api
    });
    this.root.querySelector('[data-close]').addEventListener('click', ()=>this.close());
    this.root.querySelector('[data-refresh]').addEventListener('click', ()=>this.load());
    this.root.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click', ()=>this.tab(button.dataset.tab)));
  }
  async start() {
    const catalog=await this.api.catalog();
    this.store.set( {
      catalog
    }, 'catalog.loaded');
    await this.load();
    return this;
  }
  async load() {
    this.store.set( {
      loading:true, error:null
    }, 'snapshot.loading');
    try {
      const maximumAgeHours=Number(this.root.querySelector('[data-window]').value||168);
      const snapshot=await this.api.snapshot( {
        maximumAgeHours, materialOnly:true, limit:1000
      });
      this.store.set( {
        snapshot, loading:false, selectedId:snapshot.events?.[0]?.id||null
      }, 'snapshot.loaded');
      this.live.render(snapshot);
      this.layer.show(snapshot);
      this.select(snapshot.events?.[0]?.id);
    }catch(error) {
      this.fail(error);
    }
  }
  select(id) {
    const event=this.store.get().snapshot?.events?.find(item=>item.id===id);
    this.store.set( {
      selectedId:id
    }, 'hazard.selected');
    this.detail.render(event);
    if(event&&this.map?.flyTo)this.map.flyTo(event.point.lat, event.point.lon, 6);
  }
  async runScenario(payload) {
    this.store.set( {
      loading:true, error:null
    }, 'scenario.loading');
    try {
      const scenario=await this.api.scenario(payload);
      this.store.set( {
        scenario, loading:false
      }, 'scenario.loaded');
      this.scenarioResult.render(scenario);
    }catch(error) {
      this.fail(error);
    }
  }
  tab(id) {
    this.store.set( {
      activeTab:id
    }, 'tab.changed');
    if(id==='WATCHLIST')this.watches.render().catch(error=>this.fail(error));
  }
  open() {
    this.store.set( {
      open:true
    }, 'open');
  }
  close() {
    this.store.set( {
      open:false
    }, 'close');
  }
  toggle() {
    this.store.get().open?this.close():this.open();
  }
  fail(error) {
    this.store.set( {
      loading:false, error:error.message||String(error)
    }, 'error');
  }
  reflect(state) {
    this.root.classList.toggle('hidden', !state.open);
    this.root.querySelector('[data-status]').textContent=state.loading?'LOADING…':state.error||'';
    this.root.querySelectorAll('[data-tab]').forEach(button=>button.classList.toggle('active', button.dataset.tab===state.activeTab));
    this.root.querySelectorAll('[data-pane]').forEach(pane=>pane.hidden=pane.dataset.pane!==state.activeTab);
  }
}
