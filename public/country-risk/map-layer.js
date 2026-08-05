export function installCountryRiskLayer(map){
  const id='country-risk-v20';
  return Object.freeze({
    set(features){
      map?.setGeoJsonLayer?.(id,features,{
        interactive:true,labelField:'name',localLabelField:'localName',scoreField:'riskScore'
      });
    },show(){
      map?.setLayerVisibility?.(id,true);
    },hide(){
      map?.setLayerVisibility?.(id,false);
    },remove(){
      map?.removeLayer?.(id);
    }
  });
}
