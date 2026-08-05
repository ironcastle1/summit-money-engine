import { overlayDefinition } from './definition.js';
export const LOGISTICS_OVERLAYS = Object.freeze([
  overlayDefinition({
  "id": "ports",
  "title": "Ports",
  "group": "logistics",
  "renderer": "marker",
  "source": "ports",
  "sourceMode": "static",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 500,
  "description": "commercial ports and terminals",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#31c6df",
    "fillColour": "#31c6df",
    "lineColour": "#31c6df",
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
      "label": "Ports",
      "colour": "#31c6df"
    }
  ],
  "metadata": {
    "sourceLabel": "STATIC",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "shipping-routes",
  "title": "Shipping routes",
  "group": "logistics",
  "renderer": "line",
  "source": "routes",
  "sourceMode": "static",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 510,
  "description": "major maritime trade corridors",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#31c6df",
    "fillColour": "#31c6df",
    "lineColour": "#31c6df",
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
      "label": "Shipping routes",
      "colour": "#31c6df"
    }
  ],
  "metadata": {
    "sourceLabel": "STATIC",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "chokepoints",
  "title": "Maritime chokepoints",
  "group": "logistics",
  "renderer": "marker",
  "source": "chokepoints",
  "sourceMode": "static",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 520,
  "description": "strategic straits and canal passages",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#31c6df",
    "fillColour": "#31c6df",
    "lineColour": "#31c6df",
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
      "label": "Maritime chokepoints",
      "colour": "#31c6df"
    }
  ],
  "metadata": {
    "sourceLabel": "STATIC",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "port-congestion",
  "title": "Port congestion",
  "group": "logistics",
  "renderer": "heat",
  "source": "port-congestion",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 530,
  "description": "reported delay, queue and throughput pressure",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#31c6df",
    "fillColour": "#31c6df",
    "lineColour": "#31c6df",
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
      "label": "Port congestion",
      "colour": "#31c6df"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "vessel-incidents",
  "title": "Vessel incidents",
  "group": "logistics",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 540,
  "description": "material maritime accidents and security incidents",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#31c6df",
    "fillColour": "#31c6df",
    "lineColour": "#31c6df",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 168,
  "categories": [
    "transport",
    "maritime",
    "shipping"
  ]
},
  "legend": [
    {
      "label": "Vessel incidents",
      "colour": "#31c6df"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "air-cargo",
  "title": "Air cargo hubs",
  "group": "logistics",
  "renderer": "marker",
  "source": "air-cargo",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 550,
  "description": "major international air-freight hubs",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#31c6df",
    "fillColour": "#31c6df",
    "lineColour": "#31c6df",
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
      "label": "Air cargo hubs",
      "colour": "#31c6df"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "rail-corridors",
  "title": "Rail corridors",
  "group": "logistics",
  "renderer": "line",
  "source": "rail-corridors",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 3,
  "maximumZoom": 20,
  "order": 560,
  "description": "strategic international freight rail corridors",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#31c6df",
    "fillColour": "#31c6df",
    "lineColour": "#31c6df",
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
      "label": "Rail corridors",
      "colour": "#31c6df"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "pipelines",
  "title": "Pipelines",
  "group": "logistics",
  "renderer": "line",
  "source": "pipelines",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 3,
  "maximumZoom": 20,
  "order": 570,
  "description": "major oil and gas transmission infrastructure",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#31c6df",
    "fillColour": "#31c6df",
    "lineColour": "#31c6df",
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
      "label": "Pipelines",
      "colour": "#31c6df"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
]);
export function logisticsOverlayIds() { return LOGISTICS_OVERLAYS.map(layer => layer.id); }
