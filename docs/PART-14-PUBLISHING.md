# Part 14: Reporting, Publishing and Client Delivery

Part 14 turns Merlin analysis into controlled, client-ready intelligence products. It adds publication series, editions, templates, brand kits, audience management, secure links, subscriber delivery, edition scheduling, approval and quality gates, reader analytics and archive records.

## Delivery integrity

In-app and webhook channels execute through first-party adapters. Email and Slack remain explicitly `NOT_CONFIGURED` until connectors are supplied. Secure links are signed, expiring, clearance-aware and optionally passcode protected. Downloads can be disabled, view counts can be capped, and recipient-specific watermarks are generated for traceability.

## Formats

The platform renders branded HTML, print-ready HTML, Markdown, JSON and CSV. It does not claim to generate binary PDF files without a configured rendering service; print-ready HTML is the honest default for browser-to-PDF workflows.
