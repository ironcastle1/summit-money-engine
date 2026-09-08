# V9.2 Image → CNC Editor

V9.2 stops treating automatic image tracing as a finished CNC product.

Workflow:

1. Upload image and choose starting interpretation.
2. MERLIN prepares an editable retained-steel mask.
3. Editor displays retained steel versus cut-out/empty areas.
4. User may invert, paint, flood-fill, remove islands, connect steel, thicken/thin, add a frame, or add mounting holes.
5. Final DXF creation is blocked while retained steel has multiple disconnected components.
6. A successful product is saved and its current DXF is downloadable immediately.

## Editor tools

- Invert metal / cut-out
- Keep largest steel piece
- Remove small steel islands
- Auto-connect steel
- Thicken steel
- Thin steel
- Add connected outer frame
- Paint retained steel
- Paint cut-out
- Flood-fill a clicked region as retained steel or cut-out
- 2-hole / 4-hole mounting presets
- Undo
- Reset to automatic interpretation

## Product file controls

- Download current DXF from product table or product dialog.
- Delete an uploaded product if it has no recorded sales, production runs, or order lines.
- Remove uploaded source images/assets individually.
- Bulk delete selected uploaded products. Historical product records remain protected from destructive deletion.
