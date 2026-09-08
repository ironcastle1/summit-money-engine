# MERLIN CNC V9.4 — Full repository

MERLIN V9.4 keeps the full CNC Business OS and upgrades Image → CNC Editor with automatic whole-image topology and colour/tone selection.

## V9.4 changes

- Automatic initial topology pass across the whole image.
- Nearby meaningful retained regions are joined with short bridges.
- Isolated image islands that cannot sensibly join the main design are discarded automatically.
- Dominant image colours/tones are clustered into a compact palette.
- Tick one, several or all detected colours.
- Apply checked colours to METAL or CUT-OUT in one action.
- Pick/toggle a colour directly from the image canvas.
- Existing whole-region selection, green/red overlays, frame tools, fixing-hole tools, Fusion-safe R12 DXF export, product download/delete controls and DXF resizer remain.

## Deployment

Replace the repository working tree with the contents of this package while preserving the hidden `.git` folder. Commit and push. Render installs dependencies and runs preflight/tests before startup.

Suggested commit:

`MERLIN CNC V9.4 colour selection and automatic topology`
