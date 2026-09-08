# MERLIN CNC V8.8 — Full repository

MERLIN CNC Business OS for the current CNC plasma business.

## V8.8 changes

- Image -> DXF now uses multiple automatic segmentation passes instead of failing after one threshold attempt.
- Adds Otsu thresholding, light/dark alternatives, background-colour separation and small-gap closing.
- Rejects obvious background masks and chooses the strongest connected subject candidate.
- Image-derived DXFs are emitted as Fusion-friendly AutoCAD R12 ASCII POLYLINE geometry.
- DXF Resizer fixing-hole selector now has **No fixing holes** as the default option.
- Hole dimensions are not required unless 2 or 4 holes are selected.
- All V8.7 contour repair, validated mounting-hole placement and Fusion-safe resized DXF generation remain.
- Existing Products, Inventory, Market Radar, Outreach, store imports, analytics, Tell MERLIN, finance and persistent database remain.

See `docs/V8_8_IMAGE_DXF_AND_NO_HOLES.md` for the detailed change notes.
