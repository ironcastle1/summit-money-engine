# V9.4 Colour selector and automatic topology

MERLIN V9.4 changes Image → CNC Editor in two ways.

## Automatic whole-image topology
On initial preparation MERLIN groups meaningful image regions, keeps the connected neighbourhood carrying the useful design, adds short bridges between nearby retained regions and discards isolated islands that would require an excessive bridge. The result is still editable before export.

## Colour / tone selection
MERLIN measures the average RGB colour of every detected image region and clusters similar colours into a compact palette. The palette is intentionally short rather than exposing every JPEG shade.

Users can:
- tick any detected colour group;
- tick all colour groups;
- clear the colour selection;
- select all regions using the checked colours;
- assign all checked colours to METAL or CUT-OUT;
- use "Pick/toggle colour from image" and click the canvas to toggle the colour group under the pointer.

For monochrome photographs the palette behaves as tonal bands. For colour artwork it behaves as colour clusters.

Manual brush editing remains available only for small corrections.
