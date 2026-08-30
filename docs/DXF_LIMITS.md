# DXF validation limits

MERLIN parses actual DXF vector geometry. It does not infer a cut-ready result from an attractive image.

V2 can deterministically record supported entity geometry, drawing extents, DXF unit metadata, converted physical dimensions when units are known, cut-path length for supported entities, obvious duplicate entities, unmatched endpoints, configured small-hole checks, and source-scale table fit.

If units are absent, millimetre dimensions remain null until the owner confirms units.

The source file size is not automatically treated as the intended production size. Products have separate target width/height fields.

Retained-steel topology, bridge adequacy and plasma-specific minimum detail cannot be universally proven from generic DXF geometry with the current validator. MERLIN therefore keeps those designs in review rather than falsely labelling them cut-ready.
