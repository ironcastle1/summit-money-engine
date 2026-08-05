import {
  matchesGeofence
}
from './geofence.js';
export class HazardWatchlist {
  constructor(repository) {
    this.repository=repository||new Map();
  }
  async list(owner='anonymous') {
    if(this.repository.listWatches)return this.repository.listWatches(owner);
    return [...(this.repository.get(owner)||[])];
  }
  async add(owner='anonymous', input= {
  }) {
    const watch=Object.freeze( {
      id:String(input.id||`hazard-watch-${Date.now()}`), name:String(input.name||'Hazard watch').slice(0, 120), geofence:input.geofence|| {
      }, minimumScore:Number(input.minimumScore||55), createdAt:new Date().toISOString()
    });
    if(this.repository.saveWatch)return this.repository.saveWatch(owner, watch);
    const list=this.repository.get(owner)||[];
    this.repository.set(owner, [...list, watch]);
    return watch;
  }
  async remove(owner, id) {
    if(this.repository.removeWatch)return this.repository.removeWatch(owner, id);
    const list=this.repository.get(owner)||[];
    const next=list.filter(x=>x.id!==id);
    this.repository.set(owner, next);
    return next.length!==list.length;
  }
  async evaluate(owner, events=[]) {
    const watches=await this.list(owner);
    const alerts=[];
    for(const watch of watches)for(const event of events)if((event.materiality?.score||0)>=watch.minimumScore&&matchesGeofence(event, watch.geofence))alerts.push(Object.freeze( {
      id:`${watch.id}:${event.id}`, watchId:watch.id, eventId:event.id, title:`${event.type.replaceAll('_',' ')} near ${event.region||event.country||'watched area'}`, score:event.materiality.score, createdAt:new Date().toISOString()
    }));
    return Object.freeze(alerts);
  }
}
