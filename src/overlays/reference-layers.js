import { overlayDefinition } from './definition.js';
export const REFERENCE_OVERLAYS = Object.freeze([
  overlayDefinition({
  "id": "political-boundaries",
  "title": "Political boundaries",
  "group": "reference",
  "renderer": "polygon",
  "source": "countries",
  "sourceMode": "static",
  "visible": true,
  "minimumZoom": 0,
  "maximumZoom": 20,
  "order": 100,
  "description": "sovereignty and recognised administrative borders",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#8fb3c7",
    "fillColour": "#8fb3c7",
    "lineColour": "#8fb3c7",
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
      "label": "Political boundaries",
      "colour": "#8fb3c7"
    }
  ],
  "metadata": {
    "sourceLabel": "STATIC",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "english-local-labels",
  "title": "English / local labels",
  "group": "reference",
  "renderer": "label",
  "source": "places",
  "sourceMode": "static",
  "visible": true,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 110,
  "description": "English primary names with local names below",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#8fb3c7",
    "fillColour": "#8fb3c7",
    "lineColour": "#8fb3c7",
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
      "label": "English / local labels",
      "colour": "#8fb3c7"
    }
  ],
  "metadata": {
    "sourceLabel": "STATIC",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "major-cities",
  "title": "Major cities",
  "group": "reference",
  "renderer": "marker",
  "source": "cities",
  "sourceMode": "static",
  "visible": true,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 120,
  "description": "major population and administrative centres",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#8fb3c7",
    "fillColour": "#8fb3c7",
    "lineColour": "#8fb3c7",
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
      "label": "Major cities",
      "colour": "#8fb3c7"
    }
  ],
  "metadata": {
    "sourceLabel": "STATIC",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "admin-boundaries",
  "title": "Administrative boundaries",
  "group": "reference",
  "renderer": "polygon",
  "source": "admin-boundaries",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 3,
  "maximumZoom": 20,
  "order": 130,
  "description": "first-order internal administrative areas",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#8fb3c7",
    "fillColour": "#8fb3c7",
    "lineColour": "#8fb3c7",
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
      "label": "Administrative boundaries",
      "colour": "#8fb3c7"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "maritime-boundaries",
  "title": "Maritime boundaries",
  "group": "reference",
  "renderer": "line",
  "source": "maritime-boundaries",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 2,
  "maximumZoom": 20,
  "order": 140,
  "description": "territorial seas and exclusive economic zones",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#8fb3c7",
    "fillColour": "#8fb3c7",
    "lineColour": "#8fb3c7",
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
      "label": "Maritime boundaries",
      "colour": "#8fb3c7"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "time-zones",
  "title": "Time zones",
  "group": "reference",
  "renderer": "polygon",
  "source": "time-zones",
  "sourceMode": "static",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 150,
  "description": "civil time-zone reference areas",
  "opacity": 0.82,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#8fb3c7",
    "fillColour": "#8fb3c7",
    "lineColour": "#8fb3c7",
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
      "label": "Time zones",
      "colour": "#8fb3c7"
    }
  ],
  "metadata": {
    "sourceLabel": "STATIC",
    "marketReady": true
  }
}),
]);
export function referenceOverlayIds() { return REFERENCE_OVERLAYS.map(layer => layer.id); }
