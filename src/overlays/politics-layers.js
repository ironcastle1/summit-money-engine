import { overlayDefinition } from './definition.js';
export const POLITICS_OVERLAYS = Object.freeze([
  overlayDefinition({
  "id": "elections",
  "title": "Elections",
  "group": "politics",
  "renderer": "marker",
  "source": "elections",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 400,
  "description": "scheduled and active national elections",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#b79cff",
    "fillColour": "#b79cff",
    "lineColour": "#b79cff",
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
      "label": "Elections",
      "colour": "#b79cff"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "protests",
  "title": "Protests",
  "group": "politics",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 410,
  "description": "material demonstrations and civil unrest",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#b79cff",
    "fillColour": "#b79cff",
    "lineColour": "#b79cff",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "protest",
    "civil-unrest"
  ]
},
  "legend": [
    {
      "label": "Protests",
      "colour": "#b79cff"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "sanctions",
  "title": "Sanctions",
  "group": "politics",
  "renderer": "polygon",
  "source": "sanctions",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 420,
  "description": "country and sector sanctions exposure",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#b79cff",
    "fillColour": "#b79cff",
    "lineColour": "#b79cff",
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
      "label": "Sanctions",
      "colour": "#b79cff"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "diplomatic-events",
  "title": "Diplomatic events",
  "group": "politics",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 430,
  "description": "summits, expulsions, recognition and treaty events",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#b79cff",
    "fillColour": "#b79cff",
    "lineColour": "#b79cff",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "political",
    "diplomatic"
  ]
},
  "legend": [
    {
      "label": "Diplomatic events",
      "colour": "#b79cff"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "government-stability",
  "title": "Government stability",
  "group": "politics",
  "renderer": "heat",
  "source": "government-stability",
  "sourceMode": "derived",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 440,
  "description": "institutional stability and transition risk",
  "opacity": 0.82,
  "refreshSeconds": 900,
  "style": {
    "colour": "#b79cff",
    "fillColour": "#b79cff",
    "lineColour": "#b79cff",
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
      "label": "Government stability",
      "colour": "#b79cff"
    }
  ],
  "metadata": {
    "sourceLabel": "DERIVED",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "border-closures",
  "title": "Border closures",
  "group": "politics",
  "renderer": "line",
  "source": "border-closures",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 3,
  "maximumZoom": 20,
  "order": 450,
  "description": "closed or materially restricted borders and crossings",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#b79cff",
    "fillColour": "#b79cff",
    "lineColour": "#b79cff",
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
      "label": "Border closures",
      "colour": "#b79cff"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
]);
export function politicsOverlayIds() { return POLITICS_OVERLAYS.map(layer => layer.id); }
