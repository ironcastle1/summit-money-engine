# MERLIN CNC V9.2 — Full repository

MERLIN V9.2 changes Image → DXF into an Image → CNC Editor rather than saving an automatic edge trace as a product.

## V9.2 changes

- Automatic image interpretation is now only a starting mask.
- New editor explicitly shows retained steel versus hollow/cut-out areas before a product is created.
- User can invert metal/cut-out, paint metal, paint cut-out, remove islands, keep largest steel piece, thicken/thin steel, auto-connect steel, add a connected outer frame, add 2/4 mounting-hole presets, undo and reset.
- Image export is blocked while retained steel contains disconnected islands.
- Photo stencil + connected frame mode added for ordinary photographs, while Auto can choose it when high-contrast stencil logic is inappropriate.
- Generated Image → CNC products automatically expose a Download DXF link and trigger the DXF download after creation.
- Every product modal has Download current DXF.
- Uploaded products can be deleted from the product modal or by selecting products and using Delete selected uploads. Products with recorded sales/production/order history are protected from destructive deletion.
- Attached source images/assets can be removed individually.
- Existing Fusion-safe AutoCAD R12 DXF resizer, optional fixing holes, contour repair, inventory, market radar, outreach, store imports, analytics and Tell MERLIN are retained.

## Deployment

Copy the entire repository into the GitHub repository root, preserving the hidden `.git` directory, then commit and push. Render installs dependencies and runs preflight/tests before starting the service.

Recommended commit:

`MERLIN CNC V9.2 editable CNC image designer and product file controls`
