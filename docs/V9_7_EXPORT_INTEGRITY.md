# MERLIN CNC V9.7 — Image → DXF export integrity

V9.7 fixes the failure where the Image → CNC Editor could show artwork but the downloaded DXF contained only the outer frame.

## Export rules

- The final editor mask is authoritative. Export no longer runs a morphology pass that can erase internal artwork.
- Smoothing is applied to traced vector loops, not to the binary metal/cut-out mask.
- All meaningful internal cut-out contours are retained; there is no second percentage-of-frame filter that can silently discard them.
- A framed image must contain meaningful retained steel in the interior design zone. A frame-only result is rejected.
- MERLIN counts meaningful enclosed cut-outs in the final mask and requires matching DXF contour output.
- Internal cut-out area and boundary complexity are compared before/after vectorisation. Excessive loss blocks export.
- The generated R12 DXF entity count must match the validated contour count.

If any gate fails, MERLIN returns `DXF EXPORT BLOCKED` and does not create/download a product file.
