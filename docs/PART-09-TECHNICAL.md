# Part 09 — Premium Experience Layer

Part 9 is an incremental visual and audio layer for Merlin 17.2.0. It does not alter source adapters, probability models, market calculations, opportunity scoring, billing, or persistence.

## Visual system

- Reworked colour, elevation, border, type and spacing tokens.
- Unified premium styling across every map, market, news, shipping, intelligence, replay, alert, account, administration and operations surface.
- Semantic metric states for positive, caution, negative and unavailable values.
- Improved map controls, popups, overlays, loading states, tables, forms, charts, drawers and mobile layouts.
- Comfortable and compact data-density modes.
- Ambient lighting and cursor-focus effects that can be disabled.
- Reduced-motion support through both OS preference and explicit application setting.

## Audio system

All sounds are generated at runtime with the Web Audio API. No audio files, third-party sound packs or licensing dependencies are included.

Modes:

- `OFF`: no interface audio.
- `ALERTS`: scan completion, important opportunity, connectivity, warning, critical and error cues.
- `FULL`: alert cues plus navigation, panel and interaction feedback.

The engine waits for a valid browser user gesture before creating or resuming an `AudioContext`. Volume and sound mode are persisted locally.

## Command palette

`Ctrl/Command + K` opens a searchable view/action palette. It supports keyboard movement, direct navigation, refresh, place search, workspaces, diagnostics, sound, density and motion actions.

## Performance constraints

- Pointer lighting is updated once per animation frame.
- Metric decoration uses one document-level `MutationObserver`.
- Audio is oscillator-based and creates no network requests.
- Fetch instrumentation tracks only active request count and does not inspect or modify response bodies.
- All effects fail safely when browser APIs are unavailable.
