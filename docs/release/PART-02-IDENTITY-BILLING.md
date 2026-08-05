# Part 02 — Identity, accounts and billing

Part 02 supplies the production account boundary for Merlin V20. It merges into the same repository as Part 01 and retains the existing JSON document-store deployment model while keeping repository and service contracts replaceable for a later database adapter.

## Included capabilities

- Registration and login with deterministic email normalisation.
- Scrypt password hashing, hash-upgrade detection and constant-work invalid-user handling.
- Failed-login tracking and temporary account lockouts.
- Cryptographically random opaque sessions stored only as keyed hashes.
- Strict, secure and HTTP-only session cookies with separate client session state.
- Per-session CSRF tokens and forced reauthentication after password changes.
- User, administrator and owner roles with explicit privilege ordering.
- Account status controls and owner-protection checks.
- Free, Professional and Organisation subscription plans.
- Entitlement and usage-limit evaluation with expired-plan fallback.
- Stripe, PayPal and Coinbase Commerce provider adapters.
- Webhook signature validation, event normalisation and replay/duplicate prevention.
- Manual subscription grants for authorised administrators.
- Server-side user-data buckets with plan-aware limits.
- Append-only audit records for authentication, profile, billing and administration actions.
- Admin account listing, operational metrics and audit inspection endpoints.
- Account UI controller, cloud synchronisation controller and administrative controller.

## Security properties

- Plaintext passwords and raw session tokens are never persisted.
- Authentication errors do not disclose whether an email address exists.
- Cross-site billing redirects are rejected.
- Billing webhooks are verified against their raw request bodies.
- Duplicate provider event identifiers are accepted idempotently without replaying state changes.
- Lower-privileged administrators cannot modify accounts above their own role.
- User-data storage is bounded by active entitlements.

## Repository integration

Extract this package and upload its contents into the repository root after Part 01. Accept replacement of `package.json`; the replacement only adds Part 02 verification commands and retains the Part 01 commands.

## Verification commands

```bash
npm run test:part02
npm run verify:part02
```
