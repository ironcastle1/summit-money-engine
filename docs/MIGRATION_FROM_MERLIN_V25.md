# Migration from MERLIN V25

The retained V25 manifest records 1,868 files spread across 21 browser-upload ZIP parts. It shows a Node/JavaScript application with generic infrastructure that remains valuable and large finance/geopolitical domain areas that are no longer appropriate.

## Preserve/reuse conceptually

- `server.js`
- HTTP/API registration pattern
- automation scheduler/workflow concepts
- source ingestion framework
- market-intelligence ingestion concepts
- evidence/source presentation concepts
- reliability/health diagnostics
- security/environment validation
- build verification and CI approach
- MERLIN branding and general shell/UX if desired
- PWA/offline patterns if still useful
- deployment configuration

## Rewrite for CNC domain

- market intelligence → product/competitor/supplier/current-business evidence
- opportunities → factual opportunity observations + tests, no scores
- commercial operations → products/orders/inventory/production
- decision support → owner actions from measured business state
- live data → marketplace/supplier/current-demand sources
- workspaces → product/category/production workspaces if needed
- automation → research, reorder, inventory and production tasks

## Remove from active current-stage build

- conflict intelligence
- country risk
- geopolitical hazards
- sanctions modules unrelated to present procurement/sales
- shipping/chokepoint intelligence not currently needed
- securities/asset market logic
- speculative future-region models
- hypothetical overseas factory state

## Rule

Do not preserve dead V25 code just to preserve MERLIN's historical line count. Preserve functional infrastructure when it reduces risk or development time.
