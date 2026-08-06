import { overlayDefinition } from './definition.js';
export const TERRAIN_OVERLAYS = Object.freeze([
  overlayDefinition({
  "id": "topography",
  "title": "Topography",
  "group": "terrain",
  "renderer": "raster",
  "source": "topography",
  "sourceMode": "tile",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 16,
  "order": 200,
  "description": "terrain relief and contour context",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#7fa878",
    "fillColour": "#7fa878",
    "lineColour": "#7fa878",
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
      "label": "Topography",
      "colour": "#7fa878"
    }
  ],
  "metadata": {
    "sourceLabel": "TILE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "elevation",
  "title": "Elevation bands",
  "group": "terrain",
  "renderer": "heat",
  "source": "elevation",
  "sourceMode": "tile",
  "visible": false,
  "minimumZoom": 3,
  "maximumZoom": 16,
  "order": 210,
  "description": "elevation classes for route and access analysis",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#7fa878",
    "fillColour": "#7fa878",
    "lineColour": "#7fa878",
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
      "label": "Elevation bands",
      "colour": "#7fa878"
    }
  ],
  "metadata": {
    "sourceLabel": "TILE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "land-cover",
  "title": "Land cover",
  "group": "terrain",
  "renderer": "polygon",
  "source": "land-cover",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 3,
  "maximumZoom": 16,
  "order": 220,
  "description": "urban, forest, desert and agricultural land cover",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#7fa878",
    "fillColour": "#7fa878",
    "lineColour": "#7fa878",
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
      "label": "Land cover",
      "colour": "#7fa878"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "rivers",
  "title": "Major rivers",
  "group": "terrain",
  "renderer": "line",
  "source": "rivers",
  "sourceMode": "static",
  "visible": false,
  "minimumZoom": 3,
  "maximumZoom": 18,
  "order": 230,
  "description": "navigable and strategically significant rivers",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#7fa878",
    "fillColour": "#7fa878",
    "lineColour": "#7fa878",
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
      "label": "Major rivers",
      "colour": "#7fa878"
    }
  ],
  "metadata": {
    "sourceLabel": "STATIC",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "coastlines",
  "title": "Coastlines",
  "group": "terrain",
  "renderer": "line",
  "source": "coastlines",
  "sourceMode": "static",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 240,
  "description": "high-resolution coastline reference",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#7fa878",
    "fillColour": "#7fa878",
    "lineColour": "#7fa878",
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
      "label": "Coastlines",
      "colour": "#7fa878"
    }
  ],
  "metadata": {
    "sourceLabel": "STATIC",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "terrain-shading",
  "title": "Terrain shading",
  "group": "terrain",
  "renderer": "raster",
  "source": "terrain-shading",
  "sourceMode": "tile",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 16,
  "order": 250,
  "description": "hillshade for physical-geography interpretation",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#7fa878",
    "fillColour": "#7fa878",
    "lineColour": "#7fa878",
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
      "label": "Terrain shading",
      "colour": "#7fa878"
    }
  ],
  "metadata": {
    "sourceLabel": "TILE",
    "marketReady": true
  }
}),
]);
export function terrainOverlayIds() { return TERRAIN_OVERLAYS.map(layer => layer.id); }
