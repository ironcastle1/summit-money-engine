# MERLIN CNC V8.9 — Full repository

MERLIN V8.9 keeps the complete CNC business operating system and adds a stronger Image → DXF conversion path for line drawings, separated details and images that cannot be reduced to one clean filled silhouette.

## V8.9 changes

- New **Image type** selector: Auto, Line drawing / separated details, Solid silhouette.
- Auto conversion now has a line-art rescue path when normal silhouette isolation fails.
- Additional local-contrast masks and wider threshold coverage.
- Thin-stroke boldening before contour extraction.
- Multi-component analysis with deterministic connectivity bridges into one retained steel region.
- Conversion result records how many bridges were added.
- R12 AC1009 DXF output retained.
- **No fixing holes** remains the default in the DXF Resizer.
- All V8.8/V8.7 resizer, Fusion compatibility, contour repair, product, inventory, market, outreach, store, analytics and business-memory systems remain included.

For image conversion, start with **Auto**. If a line drawing or separated artwork still cannot be isolated, choose **Line drawing / separated details** explicitly.
