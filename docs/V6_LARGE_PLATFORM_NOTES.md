# V6 Large Platform Notes

This build adds a larger modular security platform layer under `server/v6` and `/api/v6/*`.

It is not just cosmetic UI. It adds:

- threat taxonomy
- country operational profiles
- feature registry
- source pipeline registry
- verdict rules
- route safety playbooks
- offline pack service
- deep language catalog
- frontend security console catalog

Existing app routes still work. V6 endpoints are additive.

Key endpoints:

- `/api/v6/features`
- `/api/v6/threats`
- `/api/v6/countries`
- `/api/v6/sources`
- `/api/v6/verdict-rules`
- `/api/v6/route-playbooks`
- `/api/v6/offline-pack`

The next step is wiring every V6 module into the visible UI and adding database persistence.
