import { overlayDefinition } from './definition.js';
export const HAZARDS_OVERLAYS = Object.freeze([
  overlayDefinition({
  "id": "major-earthquakes",
  "title": "Major earthquakes",
  "group": "hazards",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": true,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 600,
  "description": "only earthquakes with major human, infrastructure, sovereign or shipping impact",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#ff9c55",
    "fillColour": "#ff9c55",
    "lineColour": "#ff9c55",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "earthquake"
  ],
  "materialEarthquakesOnly": true
},
  "legend": [
    {
      "label": "Major earthquakes",
      "colour": "#ff9c55"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "tropical-storms",
  "title": "Tropical storms",
  "group": "hazards",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 610,
  "description": "named storms and materially disruptive tropical systems",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#ff9c55",
    "fillColour": "#ff9c55",
    "lineColour": "#ff9c55",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "storm",
    "cyclone",
    "hurricane",
    "typhoon"
  ]
},
  "legend": [
    {
      "label": "Tropical storms",
      "colour": "#ff9c55"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "floods",
  "title": "Floods",
  "group": "hazards",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 620,
  "description": "significant river, coastal and flash flooding",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#ff9c55",
    "fillColour": "#ff9c55",
    "lineColour": "#ff9c55",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "flood"
  ]
},
  "legend": [
    {
      "label": "Floods",
      "colour": "#ff9c55"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "wildfires",
  "title": "Wildfires",
  "group": "hazards",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 630,
  "description": "large or materially disruptive wildfires",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#ff9c55",
    "fillColour": "#ff9c55",
    "lineColour": "#ff9c55",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "wildfire"
  ]
},
  "legend": [
    {
      "label": "Wildfires",
      "colour": "#ff9c55"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "volcanic-activity",
  "title": "Volcanic activity",
  "group": "hazards",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 640,
  "description": "eruptions and elevated aviation-impact alerts",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#ff9c55",
    "fillColour": "#ff9c55",
    "lineColour": "#ff9c55",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "volcano",
    "volcanic"
  ]
},
  "legend": [
    {
      "label": "Volcanic activity",
      "colour": "#ff9c55"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "extreme-heat",
  "title": "Extreme heat",
  "group": "hazards",
  "renderer": "heat",
  "source": "events",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 650,
  "description": "material heat emergencies and infrastructure stress",
  "opacity": 0.82,
  "refreshSeconds": 60,
  "style": {
    "colour": "#ff9c55",
    "fillColour": "#ff9c55",
    "lineColour": "#ff9c55",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "heat",
    "extreme-heat"
  ]
},
  "legend": [
    {
      "label": "Extreme heat",
      "colour": "#ff9c55"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
]);
export function hazardsOverlayIds() { return HAZARDS_OVERLAYS.map(layer => layer.id); }
