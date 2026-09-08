# V8.8 — Image-to-DXF recovery and explicit no-holes mode

## Image -> DXF
The browser converter no longer relies on one threshold pass. V8.8 tries multiple deterministic segmentation candidates:

- Otsu grayscale thresholding
- automatic border/average thresholding
- darker and lighter threshold variants
- both dark-subject and light-subject interpretations when Foreground is Auto
- colour-distance separation from the image border/background
- raw, small-gap-closing and cleaned mask variants

Candidates are rejected when they are implausibly tiny, effectively the whole image, or dominated by the image border. MERLIN chooses the strongest usable connected subject, keeps its enclosed cut-outs, simplifies the traced boundary according to the selected detail level, and scales it to the requested limits/current table.

The generated image-derived DXF is now written as AutoCAD R12 ASCII (AC1009) POLYLINE/VERTEX geometry rather than minimal LWPOLYLINE output.

If all automatic passes fail, MERLIN gives a concrete message telling the owner to crop closer or manually select Dark/Light foreground. It does not create an empty/bogus product.

## DXF Resizer fixing holes
The fixing-hole selector is now explicit:

- No fixing holes (default)
- 2 top holes
- 4 corner-region holes

No hole dimensions are required when No fixing holes is selected. Hole diameter, inset and surrounding-steel inputs are only validated when a 2-hole or 4-hole option is selected.
