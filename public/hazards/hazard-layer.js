export class HazardLayer {
  constructor(map) {
    this.map=map;
    this.id='merlin-hazards-v20';
  }
  show(snapshot) {
    const collection= {
      type:'FeatureCollection', features:(snapshot?.events||[]).map(event=>( {
        type:'Feature', properties: {
          id:event.id, title:event.title, type:event.type, score:event.materiality?.score||0, kind:'hazard'
        }, geometry: {
          type:'Point', coordinates:[event.point.lon, event.point.lat]
        }
      }))
    };
    if(this.map?.setRuntimeLayerData)this.map.setRuntimeLayerData(this.id, collection, {
      renderer:'cluster'
    });
    else if(this.map?.setLayerData)this.map.setLayerData(this.id, collection);
    this.last=collection;
    return collection;
  }
  clear() {
    if(this.map?.removeRuntimeLayer)this.map.removeRuntimeLayer(this.id);
    this.last=null;
  }
}
