# MERLIN CNC V9.1 — Full repository

MERLIN V9.1 is the complete CNC business operating system: product/DXF registry, Fusion-safe DXF resizer, optional validated mounting holes, Image → DXF generation, inventory, global market radar, business outreach, store imports, sales analytics, deterministic Tell MERLIN intake, finance and Render deployment.

## V9.1 Image → DXF fix

V9.0 was incorrectly blaming images after successful foreground detection. The shared vectorisation stage had two defects: closed polygons could collapse during RDP simplification because the first and last point were identical, and bridge-created boundary junctions could confuse the edge stitcher.

V9.1 fixes both. It also adds a geometry self-test and cache-busts the browser JavaScript bundle so a new deployment loads the new converter.

The exact uploaded skull regression was run through the V9.1 browser geometry functions after the fix. The high-contrast path returned 12 retained/cut contours, 21 connectivity bridges, and scaled to approximately 449.06 × 480.00 mm. The resulting AutoCAD R12 DXF was independently parsed/audited with zero errors and zero required fixes in the available audit environment.

## Upgrade

Copy the complete contents of this repository over the previous MERLIN repository while preserving the hidden `.git` directory and the Render persistent data disk.

Suggested commit:

`MERLIN CNC V9.1 image geometry pipeline fix`
