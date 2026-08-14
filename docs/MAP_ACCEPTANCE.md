# Map acceptance requirements

A release is not accepted merely because map controls exist in the DOM. V8 browser acceptance requires observable behavior:

- wheel/touchpad-style input changes numeric zoom;
- Chromium pointer drag changes map centre;
- country-border toggle changes rendered canvas pixels;
- shipping-route toggle changes rendered canvas pixels;
- current-signal toggle changes rendered canvas pixels;
- conflict, politics, sanctions, shipping, energy, cyber and market overlay toggles each change rendered canvas pixels;
- a country click opens the correct country detail;
- a signal click opens evidence, public observable indicators, market transmission and original source URL;
- desktop has no horizontal overflow;
- mobile map and signal feed remain visible;
- browser runtime errors must be zero.
