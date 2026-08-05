export class LogisticsRouteLayer {
  constructor(map) { this.map = map; this.layerId = 'logistics-route-plans'; this.registered = false; }
  ensure() { if (this.registered) return; this.map.registerOverlay?.({ id: this.layerId, name: 'Calculated routes', geometry: 'line', style: { lineColor: '#38e0a0', lineWidth: 3, lineOpacity: 0.9 } }); this.registered = true; }
  show(result, selectedRouteId = null) { this.ensure(); const features = (result?.geojson?.features || []).map(feature => ({ ...feature, properties: { ...feature.properties, selected: !selectedRouteId || feature.properties.routePlanId === selectedRouteId } })); this.map.setOverlayData?.(this.layerId, features); this.map.setOverlayState?.(this.layerId, { visible: true, opacity: 1 }); }
  clear() { this.map.setOverlayData?.(this.layerId, []); }
}
