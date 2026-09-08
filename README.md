# MERLIN CNC V8.7 — Full repository

MERLIN is the product-centred operating system for the current CNC plasma business.

## V8.7 changes

### DXF Resizer: near-closed contour repair

The resizer now repairs a common DXF defect automatically in the generated copy: if a polyline is marked open but its own first and last points are within 0.05 mm, MERLIN marks it closed before release. Genuinely open geometry remains open and is reported.

### DXF Resizer: validated fixing holes

The resizer can optionally add 2 top-region or 4 corner-region wall-fixing holes. The owner enters hole diameter, preferred edge inset and minimum steel required around each hole. MERLIN checks the requested hole against retained steel, moves it to the nearest valid retained-steel position when necessary, and refuses to release a file if it cannot place all requested holes safely according to those entered geometric constraints.

### Fusion-safe output retained

Generated resized DXFs are AutoCAD R12 ASCII files and are parsed back by MERLIN before any download is released. Size, entity count and topology are checked against the intended output.

## Existing systems retained

- permanent product/DXF registry and workshop IDs;
- deterministic DXF analysis and geometry previews;
- image-to-DXF product generation;
- inventory and production history;
- Tell MERLIN deterministic business intake;
- Global Market Radar;
- Business Outreach;
- Etsy/eBay/direct sales import infrastructure;
- performance graphs, ads, finance and activity history;
- dashboard layout controls;
- Render/GitHub deployment configuration and tests.

See `docs/V8_7_CONTOUR_REPAIR_AND_FIXING_HOLES.md` for the new resizer rules.
