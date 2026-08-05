# Part 1 Technical Structure

## Request path

`server.js` loads validated configuration, creates the application, installs shutdown handling and starts the HTTP server.

`src/app/create-application.js` constructs shared infrastructure and services. API traffic goes through request context creation, rate limiting, routing, validation and consistent JSON error handling. Static files use a traversal-safe file handler.

## Source path

Each source extends `BaseSource`. The base class applies cache policy, stale fallback, circuit-breaker state and source diagnostics. Source adapters return normalized events only.

`SourceRegistry` loads sources concurrently, combines records, removes likely duplicates and creates spatiotemporal clusters. The registry stores a short-lived immutable snapshot to prevent every browser request from re-running all upstream calls.

## Radius path

`EventService.scanRadius` takes the current snapshot and passes it to `analyzeRadius` with the selected coordinates and radius.

The analysis performs a real haversine distance calculation for every event. Only matching events enter the local sample. Event count, active days, source diversity, source availability, event age, severity, density and trend are calculated from that sample.

The 24-hour probability uses a Beta posterior over active event-days in the 30-day observation window. The estimate is withheld when the event sample is below three records.

## Client path

The client is divided into state, API, map, scan, search, source and UI modules. Map clicks update the selected coordinate and request a new scan. Radius changes redraw the geometry before requesting another scan. Category and time-window filters update both the local map layer and event list.

No client module generates probabilities or market values. Numeric estimates originate from server calculations only.
