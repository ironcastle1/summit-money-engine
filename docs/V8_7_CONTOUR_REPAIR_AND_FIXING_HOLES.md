# MERLIN V8.7 — contour repair and fixing holes

The standalone DXF Resizer now performs two additional production-preparation operations before a file is released.

## Near-closed contour repair

An open POLYLINE/LWPOLYLINE whose own first and last vertices are no more than 0.05 mm apart is treated as an accidental closure-flag defect. MERLIN closes that polyline in the generated copy. It does not edit the uploaded original.

A genuinely open contour with a larger endpoint gap remains open and is still reported by the deterministic DXF analyser.

## Optional fixing holes

The Resizer can add either:

- 2 top-region fixing holes; or
- 4 corner-region fixing holes.

The owner must provide:

- hole diameter in millimetres;
- preferred edge inset in millimetres; and
- minimum retained steel required around each hole in millimetres.

MERLIN does not assume those manufacturing values.

Hole placement uses closed DXF contours to establish an odd/even retained-steel mask. It checks the complete proposed hole circumference plus the owner's surrounding-steel allowance. If the preferred position is not retained steel, MERLIN searches for the nearest valid location. If it cannot establish enough valid locations, no DXF is released.

Every final file still passes the V8.6 R12 round-trip validation gate before a download URL is returned.
