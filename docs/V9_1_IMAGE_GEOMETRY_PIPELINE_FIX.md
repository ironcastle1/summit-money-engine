# V9.1 Image → DXF geometry pipeline fix

V9.0 successfully detected foreground masks but could still reject every real image at the final vector stage.

Two common-stage bugs were fixed:

1. `simplifyLoops()` passed a closed polygon to Ramer-Douglas-Peucker with identical first and last points. That produces a zero-length baseline and can collapse the entire contour. V9.1 simplifies the two arcs between far-apart anchors and rejoins them.
2. Boundary stitching used the first unused outgoing edge at junctions. Connectivity bridges can create junction vertices, causing the tracer to leave the intended boundary. V9.1 follows directed boundaries using a right-turn/straight/left priority so retained material remains on the same side.

The browser bundle now exposes a pure geometry self-test. The repository test suite executes it so this exact regression cannot silently return.

`index.html` also version-tags `image-dxf.js` and `app.js` so a newly deployed converter is not confused with an older cached browser asset.
