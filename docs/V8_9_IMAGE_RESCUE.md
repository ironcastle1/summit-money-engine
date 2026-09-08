# V8.9 — Image-to-DXF line-art rescue

V8.9 adds a second deterministic conversion strategy for images that are not a single filled silhouette.

The normal Auto path still prefers a clean connected subject. When that fails, the line-art rescue can:

- test additional global and local-contrast masks;
- thicken very thin foreground strokes;
- identify multiple meaningful foreground components;
- reject tiny specks and obvious background masks;
- connect separated components with narrow retained-steel bridges;
- re-run connected-component extraction after bridging;
- vectorise only the resulting connected retained region;
- report the number of connectivity bridges added.

The UI exposes **Image type**:

- Auto — clean silhouette first, rescue only if necessary.
- Line drawing / separated details — force the bridging rescue path.
- Solid silhouette — do not add bridges; only accept a clean connected silhouette.

The output remains AutoCAD R12 ASCII DXF (AC1009). The generated product must still be inspected before cutting; automatic image segmentation cannot know artistic intent from arbitrary photographs.
