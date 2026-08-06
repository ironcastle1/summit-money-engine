import { overlayDefinition } from './definition.js';
export const VERIFICATION_OVERLAYS = Object.freeze([
  overlayDefinition({
  "id": "source-density",
  "title": "Source density",
  "group": "verification",
  "renderer": "heat",
  "source": "source-density",
  "sourceMode": "derived",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 1000,
  "description": "independent source coverage density",
  "opacity": 0.82,
  "refreshSeconds": 900,
  "style": {
    "colour": "#d48cff",
    "fillColour": "#d48cff",
    "lineColour": "#d48cff",
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
      "label": "Source density",
      "colour": "#d48cff"
    }
  ],
  "metadata": {
    "sourceLabel": "DERIVED",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "verification-gaps",
  "title": "Verification gaps",
  "group": "verification",
  "renderer": "heat",
  "source": "verification-gaps",
  "sourceMode": "derived",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 1010,
  "description": "events with weak corroboration or limited source independence",
  "opacity": 0.82,
  "refreshSeconds": 900,
  "style": {
    "colour": "#d48cff",
    "fillColour": "#d48cff",
    "lineColour": "#d48cff",
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
      "label": "Verification gaps",
      "colour": "#d48cff"
    }
  ],
  "metadata": {
    "sourceLabel": "DERIVED",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "stale-signals",
  "title": "Stale signals",
  "group": "verification",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "derived",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 1020,
  "description": "signals that have exceeded their freshness policy",
  "opacity": 1,
  "refreshSeconds": 900,
  "style": {
    "colour": "#d48cff",
    "fillColour": "#d48cff",
    "lineColour": "#d48cff",
    "radius": 6,
    "lineWidth": 2
  },
  "filters": {
  "minimumConfidence": 0,
  "minimumSeverity": 0,
  "maximumAgeHours": 24
},
  "legend": [
    {
      "label": "Stale signals",
      "colour": "#d48cff"
    }
  ],
  "metadata": {
    "sourceLabel": "DERIVED",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "contradictory-claims",
  "title": "Contradictory claims",
  "group": "verification",
  "renderer": "cluster",
  "source": "events",
  "sourceMode": "derived",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 1030,
  "description": "events containing material unresolved claim conflicts",
  "opacity": 1,
  "refreshSeconds": 900,
  "style": {
    "colour": "#d48cff",
    "fillColour": "#d48cff",
    "lineColour": "#d48cff",
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
      "label": "Contradictory claims",
      "colour": "#d48cff"
    }
  ],
  "metadata": {
    "sourceLabel": "DERIVED",
    "marketReady": true
  }
}),
]);
export function verificationOverlayIds() { return VERIFICATION_OVERLAYS.map(layer => layer.id); }
