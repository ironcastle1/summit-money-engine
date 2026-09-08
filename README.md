# MERLIN CNC V9.0 — Full repository

MERLIN V9.0 is the complete CNC business operating system with the existing product registry, Fusion-safe DXF resizer, optional mounting holes, image-to-DXF generation, inventory, market radar, outreach, store imports, analytics, deterministic intake, finance and Render deployment configuration.

## V9.0 image-to-DXF fix

V9.0 adds a dedicated **High-contrast black / white stencil** conversion path and makes it part of Auto detection.

This fixes the real failure found with the uploaded skull JPG: a high-contrast image may contain several large white retained-steel regions rather than one pre-connected silhouette. Earlier versions rejected that image even though it was a very suitable CNC source.

The new path:
1. Detects near-binary black/white artwork from the image histogram.
2. Infers white or black foreground from the border unless manually overridden.
3. Uses Otsu thresholding.
4. Identifies the dominant structural regions.
5. Retains meaningful nearby detail such as teeth while dropping tiny/outlying floating highlights.
6. Connects retained regions with a minimum-distance bridge network.
7. Requires one connected retained-steel component before tracing.
8. Traces the outside and meaningful internal cut-outs.
9. Filters tiny texture holes according to Low / Medium / High detail.
10. Writes Fusion-compatible AutoCAD R12 ASCII DXF.

The actual uploaded skull image was used as a regression case. See `docs/V9_0_ACTUAL_SKULL_TEST.md`.

## DXF Resizer

The Fusion-safe resizer remains intact:
- original file is never overwritten;
- proportional resizing by width/height/bounding box;
- explicit **No fixing holes** default;
- optional 2-top or 4-corner-region fixing holes;
- near-coincident endpoint repair;
- AutoCAD R12 output;
- post-generation parse/dimension/entity validation before download.

## Deployment

This ZIP is a full GitHub-root repository. Copy all files from the extracted ZIP into the root of the existing GitHub repository, replacing the previous repository contents while preserving the hidden `.git` folder and Render persistent disk/database.

Recommended commit:

`MERLIN CNC V9.0 high-contrast stencil image conversion`
