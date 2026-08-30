# DXF analysis limits

MERLIN V1 performs deterministic analysis on common entities:

- LINE
- LWPOLYLINE
- POLYLINE
- CIRCLE
- ARC

It calculates/records:

- bounds
- width/height when units are known
- entity count
- approximate total cut-path length
- closed primitive/path count
- unmatched endpoint nodes
- duplicate entities
- unsupported entity count
- configured-too-small circles
- machine-envelope fit when units are known

## What it does not claim

V1 does not prove retained-metal topology for arbitrary artwork. In particular, it does not reliably determine every:

- floating retained island
- bridge width
- slot width
- thermal distortion risk
- kerf-sensitive weak connection
- lead-in/lead-out problem
- torch-height/process-specific issue

This is why new files are normally `review_required`, not automatically `validated`.

## Unit handling

If DXF `$INSUNITS` is missing/unitless/unsupported, MERLIN does not trust the dimension-to-machine comparison. Confirm/export the DXF in known units and re-ingest it.
