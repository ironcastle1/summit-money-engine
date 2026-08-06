import { overlayDefinition } from './definition.js';
export const HUMANITARIAN_OVERLAYS = Object.freeze([
  overlayDefinition({
  "id": "displacement",
  "title": "Displacement",
  "group": "humanitarian",
  "renderer": "heat",
  "source": "displacement",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 800,
  "description": "refugee and internally displaced population pressure",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#74d6a2",
    "fillColour": "#74d6a2",
    "lineColour": "#74d6a2",
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
      "label": "Displacement",
      "colour": "#74d6a2"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "food-security",
  "title": "Food security",
  "group": "humanitarian",
  "renderer": "polygon",
  "source": "food-security",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 810,
  "description": "acute food insecurity classification",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#74d6a2",
    "fillColour": "#74d6a2",
    "lineColour": "#74d6a2",
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
      "label": "Food security",
      "colour": "#74d6a2"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "health-emergencies",
  "title": "Health emergencies",
  "group": "humanitarian",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 820,
  "description": "declared or materially disruptive health emergencies",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#74d6a2",
    "fillColour": "#74d6a2",
    "lineColour": "#74d6a2",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "health",
    "disease",
    "epidemic"
  ]
},
  "legend": [
    {
      "label": "Health emergencies",
      "colour": "#74d6a2"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "aid-access",
  "title": "Aid access",
  "group": "humanitarian",
  "renderer": "polygon",
  "source": "aid-access",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 830,
  "description": "humanitarian-access constraints and closures",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#74d6a2",
    "fillColour": "#74d6a2",
    "lineColour": "#74d6a2",
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
      "label": "Aid access",
      "colour": "#74d6a2"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
]);
export function humanitarianOverlayIds() { return HUMANITARIAN_OVERLAYS.map(layer => layer.id); }
