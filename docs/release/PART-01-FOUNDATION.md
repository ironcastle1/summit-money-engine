# Part 01 — Runtime and platform foundation

Part 01 replaces the bootstrap and infrastructure layer of the uploaded repository without removing existing product services.

## Included changes

- Central V20 version and runtime metadata.
- Production startup readiness gate with explicit blockers and warnings.
- Structured connector configuration summary without exposing credentials.
- Exportable, testable server bootstrap.
- Idempotent reverse-order shutdown coordinator with bounded task deadlines.
- Centralised security-header and Content Security Policy builder.
- Per-request deadline object available to API handlers and services.
- Existing rate limiting, origin checks, runtime sampling, metrics and health endpoints retained.
- New `/api/ops/startup` diagnostics endpoint.
- GitHub Actions verification on Node.js 20 and 22.
- Safe environment template and repository ignore rules.
- Part-specific syntax, secret-pattern and manifest verification.

## Compatibility

The package is designed to overwrite matching paths in the uploaded V18 repository. It intentionally does not include domain, connector, map or client feature files; those arrive in later numbered parts.

## Commands

```bash
npm run test:part01
npm run verify:part01
```
