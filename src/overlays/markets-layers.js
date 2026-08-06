import { overlayDefinition } from './definition.js';
export const MARKETS_OVERLAYS = Object.freeze([
  overlayDefinition({
  "id": "commodity-exposure",
  "title": "Commodity exposure",
  "group": "markets",
  "renderer": "heat",
  "source": "commodity-exposure",
  "sourceMode": "derived",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 900,
  "description": "regional exposure to key commodity price shocks",
  "opacity": 0.82,
  "refreshSeconds": 900,
  "style": {
    "colour": "#58a6ff",
    "fillColour": "#58a6ff",
    "lineColour": "#58a6ff",
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
      "label": "Commodity exposure",
      "colour": "#58a6ff"
    }
  ],
  "metadata": {
    "sourceLabel": "DERIVED",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "trade-flows",
  "title": "Trade flows",
  "group": "markets",
  "renderer": "line",
  "source": "trade-flows",
  "sourceMode": "connector",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 910,
  "description": "bilateral merchandise trade corridors",
  "opacity": 1,
  "refreshSeconds": 3600,
  "style": {
    "colour": "#58a6ff",
    "fillColour": "#58a6ff",
    "lineColour": "#58a6ff",
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
      "label": "Trade flows",
      "colour": "#58a6ff"
    }
  ],
  "metadata": {
    "sourceLabel": "CONNECTOR",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "prediction-markets",
  "title": "Prediction markets",
  "group": "markets",
  "renderer": "marker",
  "source": "prediction-markets",
  "sourceMode": "live",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 920,
  "description": "geographically linked public prediction-market probabilities",
  "opacity": 1,
  "refreshSeconds": 60,
  "style": {
    "colour": "#58a6ff",
    "fillColour": "#58a6ff",
    "lineColour": "#58a6ff",
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
      "label": "Prediction markets",
      "colour": "#58a6ff"
    }
  ],
  "metadata": {
    "sourceLabel": "LIVE",
    "marketReady": true
  }
}),
  overlayDefinition({
  "id": "supply-chain-risk",
  "title": "Supply-chain risk",
  "group": "markets",
  "renderer": "heat",
  "source": "supply-chain-risk",
  "sourceMode": "derived",
  "visible": false,
  "minimumZoom": 1,
  "maximumZoom": 20,
  "order": 930,
  "description": "derived logistics and geopolitical supply-chain pressure",
  "opacity": 0.82,
  "refreshSeconds": 900,
  "style": {
    "colour": "#58a6ff",
    "fillColour": "#58a6ff",
    "lineColour": "#58a6ff",
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
      "label": "Supply-chain risk",
      "colour": "#58a6ff"
    }
  ],
  "metadata": {
    "sourceLabel": "DERIVED",
    "marketReady": true
  }
}),
]);
export function marketsOverlayIds() { return MARKETS_OVERLAYS.map(layer => layer.id); }
