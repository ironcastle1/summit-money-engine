# Part 13: Automation, Alerting and Workflow Orchestration

Part 13 adds a first-party workflow engine to Merlin. It compiles dependency-safe workflows, evaluates domain triggers, executes auditable actions, applies idempotency and rate controls, routes notifications honestly, and exposes a complete Automation workspace.

## Trigger catalogue

Manual, scheduled, event, market threshold, material hazard, country risk, route disruption, connector health, data freshness, geofence and decision-signal triggers are supported.

## Action catalogue

Workflows can create tasks, open case files, generate reports, add watch definitions, issue notifications, call configured webhooks, record notes and request approvals. Email and Slack are reported as unavailable until their connectors are configured; the system does not pretend delivery occurred.

## Operational safeguards

Dependency cycle detection, bounded concurrency, action deadlines, retry policies, idempotency keys, dedupe windows, quiet hours, channel rate limits, tamper-evident audit records and run histories are enforced by the runtime.
