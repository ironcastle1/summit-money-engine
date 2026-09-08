# V9.0 — High-contrast stencil conversion

V9.0 adds a dedicated conversion path for nearly binary black/white artwork such as skulls, stencils and thresholded photographs.

The older Image → DXF pipeline assumed that the retained foreground would already exist as one connected component. That is often false: a valid stencil can contain two or more large white structural regions plus many small white highlights. V9.0 detects this image class from the histogram and treats it differently.

## Deterministic process

1. Detect whether at least 90% of image pixels are near black (<64) or near white (>192).
2. Determine foreground polarity from the image border unless the owner explicitly chooses Dark or Light.
3. Threshold using Otsu.
4. Find connected foreground components.
5. Identify the large structural core.
6. Retain meaningful detail components near that core while discarding tiny/outlying floating highlights.
7. Join retained components with a minimum-distance bridge network.
8. Require the resulting retained steel to be one connected component.
9. Trace its outer boundary and meaningful internal cut-outs.
10. Filter very small pixel-scale holes according to Low / Medium / High detail mode.
11. Scale proportionally to the requested/table envelope.
12. Write AutoCAD R12 ASCII DXF geometry.

The converter reports when connectivity bridges were added. The original image is retained with the product.

This does not replace machine-specific minimum bridge/hole calibration. MERLIN must still avoid claiming fully cut-ready geometry where current machine minimums are not known.
