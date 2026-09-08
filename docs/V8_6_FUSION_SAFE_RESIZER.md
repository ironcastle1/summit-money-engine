# MERLIN V8.6 — Fusion-safe DXF resizer

V8.6 changes the standalone DXF resizer so a mathematically correct size is not enough for a file to be released.

## Output format

Resized files are now written as AutoCAD R12 ASCII (`AC1009`) using classic, widely-supported entity structures:

- `LINE`
- `POLYLINE` + `VERTEX` + `SEQEND`
- `CIRCLE`
- `ARC`

Source `LWPOLYLINE` and `POLYLINE` entities are both emitted as classic R12 `POLYLINE` sequences. Polyline closure flags, bulge values and per-vertex start/end widths are preserved and scaled where applicable.

The writer includes basic LTYPE and LAYER tables and EXTMIN/EXTMAX header values for compatibility with stricter CAD importers.

## Mandatory round-trip validation

Before MERLIN stores or exposes a generated file for download it parses the generated DXF again and checks:

1. the file parses successfully;
2. generated width and height match the requested calculated dimensions within 0.08 mm;
3. entity count matches the source;
4. closed-contour count matches the source;
5. open-contour state matches the source;
6. no unsupported entity appears after rewriting.

If any of these checks fail, the API returns an error and no downloadable file is released.

## Units

R12 does not have the later standard `$INSUNITS` header variable. MERLIN writes all generated coordinates in millimetres and validates them internally as millimetres. The result panel states this explicitly.

## CNC validation is separate

A DXF can be structurally valid and open in Fusion while still containing an open contour, inadequate bridge, small hole, floating retained island, or other production issue. MERLIN therefore reports file-format validation separately from CNC geometry warnings and does not equate "Fusion-readable" with "cut-ready".
