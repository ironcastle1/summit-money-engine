# MERLIN CNC V9.5 — Full repository

MERLIN V9.5 keeps the full CNC Business OS and fixes three Image → CNC Editor problems found during live testing:

1. **Real colour/tone selection**
   - The palette is now built directly from the complete source image pixels, not merely from already-detected connected regions.
   - Dominant RGB/tonal groups are always rendered as visible swatches with checkboxes, hex values, image coverage and piece counts.
   - Selecting a colour applies across the whole image, including disconnected areas of the same colour.
   - Clicking the canvas in “Pick/toggle colour from image” mode now reads the source pixel’s colour cluster directly.

2. **Frame-aware fixing holes**
   - If an outer frame has been added, 2-top or 4-corner mounting holes are generated in dedicated frame pads and connected back to the frame.
   - Hole placement is no longer based on arbitrary retained artwork when a frame exists.
   - The frame metadata is tracked through undo/reset so stale frame state cannot affect later hole placement.

3. **Smoother DXF geometry**
   - Added edge cleanup plus selectable DXF vector smoothing: None, Light, Medium, Strong.
   - Closed raster contours are smoothed with repeated Chaikin corner cutting followed by closed-loop simplification before R12 DXF export.
   - Medium smoothing is the default.
   - The existing Fusion-compatible AutoCAD R12 / AC1009 output remains.

Other MERLIN systems remain present: Products, DXF Resizer, Image → CNC Editor, product/file deletion, inventory, market radar, outreach, store imports, sales analytics, Tell MERLIN, finance, activity, dashboard layouts and persistent SQLite storage.

## Upgrade

Replace the existing repository contents with the contents of the full V9.5 ZIP while keeping the hidden `.git` folder. Commit and push to `main`; Render can then redeploy from GitHub.

Suggested commit:

`MERLIN CNC V9.5 colour palette frame holes and smooth vectors`
