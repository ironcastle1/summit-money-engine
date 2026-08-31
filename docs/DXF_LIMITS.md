# DXF validation limits — MERLIN V5

MERLIN can deterministically inspect supported vector entities and report factual geometry information. Unitless files remain unitless until the owner confirms their intended units.

Current validator can record, where supported:

- drawing extents;
- DXF unit metadata;
- physical dimensions when unit conversion is established;
- entity count;
- closed/open path counts;
- cut-path length;
- obvious duplicate entities;
- unsupported entity count;
- source-scale fit inside the currently recorded table envelope.

The validator does not claim to prove retained-steel topology for every arbitrary artwork. Minimum bridge/hole/slot rules remain unset until calibrated from actual machine results. A visually good preview is not automatically a production-ready file.
