export class HazardStateStore {
  constructor() {
    this.state=Object.freeze( {
      open:false, loading:false, error:null, activeTab:'LIVE', catalog:null, snapshot:null, selectedId:null, scenario:null, watches:[]
    });
    this.listeners=new Set();
  }
  get() {
    return this.state;
  }
  set(patch, reason='update') {
    this.state=Object.freeze( {
      ...this.state, ...patch
    });
    for(const listener of this.listeners)listener(this.state, reason);
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return()=>this.listeners.delete(listener);
  }
}
