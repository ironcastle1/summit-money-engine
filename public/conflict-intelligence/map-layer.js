const SOURCE_ID = 'merlin-conflict-intelligence';
const THEATRE_LAYER_ID = 'merlin-conflict-theatres';
const FRONT_LAYER_ID = 'merlin-conflict-frontlines';
const LABEL_LAYER_ID = 'merlin-conflict-labels';

function setVisibility(map, layerId, visible) {
  if (!map?.getLayer?.(layerId)) return;
  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
}

function ensureSource(map, features) {
  if (!map?.addSource || !map?.addLayer) return false;
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: features
    });
  }
  if (!map.getLayer(FRONT_LAYER_ID)) {
    map.addLayer({
      id: FRONT_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'risk'], 0],
          0, '#6f8290',
          45, '#e4a23d',
          75, '#ff4f68'
        ],
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.2, 7, 4],
        'line-opacity': 0.86,
        'line-dasharray': [1.5, 1]
      }
    });
  }
  if (!map.getLayer(THEATRE_LAYER_ID)) {
    map.addLayer({
      id: THEATRE_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'CONFLICT_THEATRE'],
      paint: {
        'circle-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'risk'], 0],
          0, '#587286',
          25, '#d0a83f',
          45, '#df7c38',
          65, '#d74652',
          80, '#9f1835'
        ],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 5, 7, 12],
        'circle-opacity': 0.88,
        'circle-stroke-color': '#07131d',
        'circle-stroke-width': 1.5
      }
    });
  }
  if (!map.getLayer(LABEL_LAYER_ID)) {
    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      minzoom: 3.5,
      filter: ['==', ['get', 'kind'], 'CONFLICT_THEATRE'],
      layout: {
        'text-field': [
          'case',
          ['all', ['has', 'nameLocal'], ['!=', ['get', 'nameLocal'], '']],
          ['format', ['get', 'name'], {}, '\n(', {}, ['get', 'nameLocal'], {}, ')', {}],
          ['get', 'name']
        ],
        'text-size': 10,
        'text-offset': [0, 1.35],
        'text-anchor': 'top',
        'text-allow-overlap': false
      },
      paint: {
        'text-color': '#ffe8c4',
        'text-halo-color': '#07131d',
        'text-halo-width': 1.4
      }
    });
  }
  return true;
}

export function installConflictLayer(map, options = {}) {
  let features = {
    type: 'FeatureCollection',
    features: []
  };
  let visible = true;
  let interactionsBound = false;

  function bindInteractions() {
    if (interactionsBound || !map?.on || !map?.getLayer?.(THEATRE_LAYER_ID)) return;
    interactionsBound = true;
    map.on('mouseenter', THEATRE_LAYER_ID, () => {
      if (map.getCanvas) map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', THEATRE_LAYER_ID, () => {
      if (map.getCanvas) map.getCanvas().style.cursor = '';
    });
    map.on('click', THEATRE_LAYER_ID, event => {
      const id = event.features?.[0]?.properties?.id;
      if (id) options.onSelect?.(id);
    });
  }

  function render() {
    if (map?.setConflictFeatures) {
      map.setConflictFeatures(features);
      return;
    }
    try {
      ensureSource(map, features);
      map?.getSource?.(SOURCE_ID)?.setData?.(features);
      setVisibility(map, THEATRE_LAYER_ID, visible);
      setVisibility(map, FRONT_LAYER_ID, visible);
      setVisibility(map, LABEL_LAYER_ID, visible);
      bindInteractions();
    } catch (error) {
      console.warn('conflict-intelligence.map-layer.failed', error);
    }
  }

  function set(next) {
    features = next || features;
    render();
  }

  function show() {
    visible = true;
    render();
  }

  function hide() {
    visible = false;
    render();
  }

  map?.on?.('load', render);
  map?.on?.('styledata', render);

  return Object.freeze({
    set,
    show,
    hide,
    get features() {
      return features;
    }
  });
}
