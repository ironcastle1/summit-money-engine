# Data and provenance

MERLIN separates collection state from analytical state.

- `ok`: upstream responded with usable records.
- `ok-empty`: upstream responded successfully but returned no usable current record.
- `error`: upstream failed or timed out. The failure is shown in Source Diagnostics.
- `seed`: source has not yet been checked in the current build-snapshot state.

Build-snapshot records are timestamped public records bundled at release time. They are not represented as live. The signal detail drawer displays the capture notice and original public-source link.

Live refreshes use bounded per-source timeouts and concurrent workers. One failed publisher cannot fail the complete refresh. Recent successfully collected live records and market quotes can be retained as last-known-good data for short bounded periods.

Prediction-market data is collected as context only and is not treated as proof that an event occurred.
