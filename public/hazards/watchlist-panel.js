import {
  text
}
from './format.js';
export class HazardWatchlistPanel {
  constructor(options) {
    this.root=options.root;
    this.api=options.api;
  }
  async render() {
    const result=await this.api.watchlist();
    const watches=result.watches||[];
    this.root.innerHTML=`<form data-watch-form><input name="name" placeholder="WATCH NAME" required><input name="lat" type="number" step="0.01" placeholder="LAT" required><input name="lon" type="number" step="0.01" placeholder="LON" required><input name="radiusKm" type="number" value="250" min="10"><input name="minimumScore" type="number" value="60" min="1" max="100"><button>ADD WATCH</button></form><div>${watches.map(w=>`<article class="hazard-watch"><b>$ {
      text(w.name)
    }
    </b><small>$ {
      w.geofence?.radiusKm||0
    }
    KM · SCORE ≥ $ {
      w.minimumScore
    }
    </small></article>`).join('')||'<div class="hazard-empty">No hazard watches.</div>'}</div>`;
    this.root.querySelector('form').addEventListener('submit', async event=> {
      event.preventDefault();
      const data=new FormData(event.currentTarget);
      await this.api.addWatch( {
        name:data.get('name'), minimumScore:Number(data.get('minimumScore')), geofence: {
          center: {
            lat:Number(data.get('lat')), lon:Number(data.get('lon'))
          }, radiusKm:Number(data.get('radiusKm'))
        }
      });
      await this.render();
    });
  }
}
