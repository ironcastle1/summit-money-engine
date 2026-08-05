export class MarketSignalLayer {
  constructor(map) { this.map = map; this.features = { type: 'FeatureCollection', features: [] }; }
  setData(features) {
    this.features = features || { type: 'FeatureCollection', features: [] };
    if (this.map?.setOverlayData) this.map.setOverlayData('market-signals', this.features);
    else if (this.map?.getSource?.('merlin-market-signals')) this.map.getSource('merlin-market-signals').setData(this.features);
  }
  clear() { this.setData({ type: 'FeatureCollection', features: [] }); }
}
