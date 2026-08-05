# Part 20 Acceptance Record

The Part 20 acceptance process consists of:

1. Focused market-readiness unit and integration tests.
2. Complete cumulative repository tests.
3. JavaScript syntax validation.
4. Embedded-secret scanning.
5. Static browser import-graph validation.
6. Rendered Chromium checks at 360×740, 430×932, 820×1180, 1366×768, 1440×900 and 1920×1080.
7. Archive extraction and clean-merge retesting over Parts 1–19.
8. Manifest, checksum and file-count verification.

The browser report and screenshots are retained in `docs/part20-browser-evidence/`. No test is represented as a Firefox or Safari/WebKit execution unless those engines are actually run.
