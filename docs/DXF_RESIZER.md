# MERLIN DXF Resizer

V8.3 adds a standalone DXF resizing utility under **Products**.

## Workflow
1. Upload an existing `.dxf`.
2. Leave **Source units** on `Use DXF header` if the file declares units. If MERLIN says the units are unknown, choose the correct units manually.
3. Enter either:
   - target width in mm; or
   - target height in mm; or
   - both width and height to fit proportionally inside that box; or
   - `Fit as large as possible to current table`.
4. Press **Create resized DXF**.
5. MERLIN reports the original physical size, new physical size, scale percentage and whether the new file fits the current table.
6. Press the generated **Download** link.

The uploaded source file is never overwritten.

## Geometry handling
The deterministic safe resizer currently rewrites these DXF entity types:
- LINE
- LWPOLYLINE
- POLYLINE
- CIRCLE
- ARC

If a file contains another entity type, MERLIN refuses the resize instead of silently losing it.

Polylines retain bulge values. The generated file is written in millimetres (`$INSUNITS = 4`) and its geometry is normalised to start at the lower-left of the drawing bounds.

## Proportions
The resizer is proportional only. It never stretches one axis independently. If width and height are both supplied, the design is scaled until it fits inside both requested limits.

## CNC validation
After writing the new DXF, MERLIN parses the generated file again and runs the same deterministic checks used by the Product Registry, including current-table fit. This does not override the existing rule that unknown minimum feature/bridge rules remain unknown until calibrated from real cuts.
