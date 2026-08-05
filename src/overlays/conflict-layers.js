import { overlayDefinition } from './definition.js';
export const CONFLICT_OVERLAYS = Object.freeze([
  overlayDefinition({
  "id": "active-wars",
  "title": "Active wars",
  "group": "conflict",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": true,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 300,
  "description": "material armed conflict and war events",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#ef596f",
    "fillColour": "#ef596f",
    "lineColour": "#ef596f",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "conflict",
    "war",
    "military",
    "terror"
  ]
},
  "legend": [
    {
      "label": "Active wars",
      "colour": "#ef596f"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "front-lines",
  "title": "Front lines",
  "group": "conflict",
  "renderer": "line",
  "source": "front-lines",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 4,
  "maximumZoom": 20,
  "order": 310,
  "description": "assessed areas of control and active front lines",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#ef596f",
    "fillColour": "#ef596f",
    "lineColour": "#ef596f",
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
      "label": "Front lines",
      "colour": "#ef596f"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "strikes-explosions",
  "title": "Strikes and explosions",
  "group": "conflict",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 320,
  "description": "airstrikes, missile attacks and major explosions",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#ef596f",
    "fillColour": "#ef596f",
    "lineColour": "#ef596f",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "conflict",
    "war",
    "military",
    "explosion",
    "airstrike",
    "missile"
  ]
},
  "legend": [
    {
      "label": "Strikes and explosions",
      "colour": "#ef596f"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "armed-groups",
  "title": "Armed groups",
  "group": "conflict",
  "renderer": "marker",
  "source": "armed-groups",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 3,
  "maximumZoom": 20,
  "order": 330,
  "description": "known armed-group areas and headquarters",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#ef596f",
    "fillColour": "#ef596f",
    "lineColour": "#ef596f",
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
      "label": "Armed groups",
      "colour": "#ef596f"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "military-bases",
  "title": "Military bases",
  "group": "conflict",
  "renderer": "marker",
  "source": "military-bases",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 4,
  "maximumZoom": 20,
  "order": 340,
  "description": "declared and publicly documented military facilities",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#ef596f",
    "fillColour": "#ef596f",
    "lineColour": "#ef596f",
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
      "label": "Military bases",
      "colour": "#ef596f"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "naval-deployments",
  "title": "Naval deployments",
  "group": "conflict",
  "renderer": "marker",
  "source": "naval-deployments",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 350,
  "description": "material publicly reported naval deployments",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#ef596f",
    "fillColour": "#ef596f",
    "lineColour": "#ef596f",
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
      "label": "Naval deployments",
      "colour": "#ef596f"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
]);
export function conflictOverlayIds() { return CONFLICT_OVERLAYS.map(layer => layer.id); }
