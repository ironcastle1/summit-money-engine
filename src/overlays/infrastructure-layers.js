import { overlayDefinition } from './definition.js';
export const INFRASTRUCTURE_OVERLAYS = Object.freeze([
  overlayDefinition({
  "id": "power-grid",
  "title": "Power grid",
  "group": "infrastructure",
  "renderer": "line",
  "source": "power-grid",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 4,
  "maximumZoom": 20,
  "order": 700,
  "description": "cross-border transmission and major grid corridors",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#f0ca64",
    "fillColour": "#f0ca64",
    "lineColour": "#f0ca64",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
    "minimumConfidence": 0,
    "minimumSeverity": 0,
    "maximumAgeHours": 168
  },
  "legend": [
    {
      "label": "Power grid",
      "colour": "#f0ca64"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "subsea-cables",
  "title": "Subsea cables",
  "group": "infrastructure",
  "renderer": "line",
  "source": "subsea-cables",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 710,
  "description": "international telecommunications cable routes",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#f0ca64",
    "fillColour": "#f0ca64",
    "lineColour": "#f0ca64",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
    "minimumConfidence": 0,
    "minimumSeverity": 0,
    "maximumAgeHours": 168
  },
  "legend": [
    {
      "label": "Subsea cables",
      "colour": "#f0ca64"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "data-centres",
  "title": "Data centres",
  "group": "infrastructure",
  "renderer": "marker",
  "source": "data-centres",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 4,
  "maximumZoom": 20,
  "order": 720,
  "description": "major hyperscale and strategic data-centre clusters",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#f0ca64",
    "fillColour": "#f0ca64",
    "lineColour": "#f0ca64",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
    "minimumConfidence": 0,
    "minimumSeverity": 0,
    "maximumAgeHours": 168
  },
  "legend": [
    {
      "label": "Data centres",
      "colour": "#f0ca64"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "airports",
  "title": "Airports",
  "group": "infrastructure",
  "renderer": "marker",
  "source": "airports",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 3,
  "maximumZoom": 20,
  "order": 730,
  "description": "major international and strategic airports",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#f0ca64",
    "fillColour": "#f0ca64",
    "lineColour": "#f0ca64",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
    "minimumConfidence": 0,
    "minimumSeverity": 0,
    "maximumAgeHours": 168
  },
  "legend": [
    {
      "label": "Airports",
      "colour": "#f0ca64"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "energy-sites",
  "title": "Energy sites",
  "group": "infrastructure",
  "renderer": "marker",
  "source": "energy-sites",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 3,
  "maximumZoom": 20,
  "order": 740,
  "description": "refineries, LNG terminals, nuclear and generation sites",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#f0ca64",
    "fillColour": "#f0ca64",
    "lineColour": "#f0ca64",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
    "minimumConfidence": 0,
    "minimumSeverity": 0,
    "maximumAgeHours": 168
  },
  "legend": [
    {
      "label": "Energy sites",
      "colour": "#f0ca64"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "industrial-sites",
  "title": "Industrial sites",
  "group": "infrastructure",
  "renderer": "marker",
  "source": "industrial-sites",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 4,
  "maximumZoom": 20,
  "order": 750,
  "description": "major industrial, mining and manufacturing sites",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#f0ca64",
    "fillColour": "#f0ca64",
    "lineColour": "#f0ca64",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
    "minimumConfidence": 0,
    "minimumSeverity": 0,
    "maximumAgeHours": 168
  },
  "legend": [
    {
      "label": "Industrial sites",
      "colour": "#f0ca64"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
]);
export function infrastructureOverlayIds() { return INFRASTRUCTURE_OVERLAYS.map(layer => layer.id); }
