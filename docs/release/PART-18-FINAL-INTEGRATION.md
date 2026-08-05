# Merlin V20 Part 18 — Final integration and release engineering

Part 18 adds the release-control plane used to assess the complete 18-part build. It inventories components, contracts, migrations, artifacts, checksums, evidence, compatibility, performance budgets, deployment gates, upgrade and rollback plans, software-bill-of-materials data, licences, provenance and final acceptance.

It does not certify a deployment merely because files exist. Go-live remains blocked until required evidence, approvals, backup state, migration readiness, rollback readiness, support handover and status communication are recorded.
