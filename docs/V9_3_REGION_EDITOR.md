# MERLIN V9.3 — Region-based CNC image editor

V9.3 changes the image editor from a brush-first binary mask editor into a detected-piece editor.

## Visual meaning
- GREEN overlay: retained steel.
- RED overlay: cut away / hollow.
- YELLOW overlay/outline: currently selected detected image piece.
- The original source image can remain visible underneath the overlays.

## Detected pieces
MERLIN quantises source-image luminance into tonal bands, finds connected regions within those bands, filters tiny regions, and exposes the meaningful regions as selectable pieces.

The user can:
- click a whole region to select it;
- Shift-click to select multiple regions;
- select similar-tone regions;
- assign selected regions to METAL or CUT-OUT;
- rerun piece detection at Large / Standard / Fine detail;
- auto-assign every detected region from MERLIN's current automatic CNC interpretation.

The important change is that assigning a detected piece updates the whole piece, not a small brush area.

## Brush editing
Brush editing is retained only for fine correction. Region selection is the default editor mode.

## Production feature buttons
The main editor exposes direct buttons for:
- Add outer frame
- Add 2 top mounting holes
- Add 4 corner-region mounting holes

Hole diameter, retained-steel clearance, and preferred inset remain user controlled.

## Cut-ready gate
The final DXF export remains blocked if retained steel consists of multiple disconnected pieces.
