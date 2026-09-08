# V9.0 actual uploaded skull-image regression test

The V9.0 high-contrast stencil path was tuned against the owner's actual uploaded 736×806 JPG skull artwork.

Observed source properties:
- 97.9% of pixels were near black (<64) or near white (>192).
- Otsu threshold: approximately 124.
- The white retained artwork was not one connected region.
- Two dominant structural regions were approximately 76,415 and 61,558 pixels, with meaningful smaller tooth/detail regions around them.

The V9.0 strategy therefore does not discard the image just because the foreground is fragmented. It retains the dominant structure plus meaningful nearby detail components, removes tiny/outlying white noise, and builds a minimum-distance bridge network so retained steel becomes one connected object.

A local regression prototype using the same deterministic rules produced:
- 23 retained foreground components before joining.
- 22 short connectivity joins.
- longest required join approximately 12.53 source pixels after meaningful-detail filtering.
- medium-detail trace: 21 cut contours after small texture-hole filtering.
- proportional 480 mm maximum-height output: approximately 449.0 × 480.0 mm.
- AutoCAD R12 / AC1009 DXF audit: 0 errors, 0 fixes required.

This test proves that the previous 'no usable geometry' failure condition is removed for this exact image class. It does not establish calibrated minimum bridge/hole capability for the physical plasma process; those remain separate machine-specific production checks.
