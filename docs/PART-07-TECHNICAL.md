# Part 07 Technical Architecture

## Scope

Part 7 adds account identity, session security, subscription state, payment-provider adapters, server persistence, plan entitlements and role-gated administration. It does not make an unconfigured provider appear operational and it does not store billing-card data.

## Account document store

The default deployment uses one atomic JSON document containing:

- users
- sessions
- subscriptions
- user data buckets
- usage counters
- audit events
- processed webhook identifiers

Writes are serialised through a promise queue. Each update is written to a process-specific temporary file with mode `0600`, then atomically renamed over the target. `runtime-data/` is ignored by Git.

This store is suitable for one Node process and straightforward self-hosted deployments. A multi-instance deployment must replace the repositories with a transactional shared database.

## Authentication

Passwords use Node's scrypt implementation with:

- random 16-byte salt
- cost `N=16384`
- block size `r=8`
- parallelisation `p=1`
- 64-byte derived key

Login failures are counted per account. Five consecutive failures cause a 15-minute lock. Successful login clears the counter. Password change revokes every active session for that user.

Sessions use 32-byte random bearer tokens. Only an HMAC-derived token hash is used for lookup. Cookies are `HttpOnly`, `SameSite=Strict`, and `Secure` in production. Session TTL is configurable.

Authenticated state changes require an independent CSRF token delivered after authentication and submitted through `X-CSRF-Token`.

## Roles

Role order:

1. USER
2. ANALYST
3. ADMIN
4. OWNER

Role and account-state changes are constrained by hierarchy. Administrators cannot modify equal or higher roles. Suspending or disabling an account revokes its sessions.

## Plans and entitlements

The plan catalogue is server-owned and denominated in GBP:

| Plan | Monthly catalogue price | Watchlist assets | Workspaces | Alert rules | Saved searches | Exports/day | API requests/day |
|---|---:|---:|---:|---:|---:|---:|---:|
| FREE | £0 | 8 | 2 | 3 | 3 | 5 | 500 |
| PRO | £19 | 100 | 50 | 50 | 100 | 250 | 20,000 |
| TEAM | £59 | 500 | 250 | 250 | 500 | 2,000 | 100,000 |

Expired, cancelled, absent or unsupported subscription states fall back to free entitlements. Data-bucket writes are size-limited to 1 MB and item-count limited by the active plan.

## Billing providers

### Stripe

Creates hosted subscription checkout sessions against configured Price IDs. Incoming events are verified against the raw request body and Stripe signature timestamp. Subscription lifecycle events are normalised into internal states.

### PayPal

Creates subscription approvals against configured PayPal Plan IDs. Webhooks are verified through PayPal's verification endpoint before any state mutation.

### Coinbase

Creates one-time access checkouts. Authentication supports either a business bearer token or a CDP ES256 request JWT. Webhooks use timestamped HMAC verification. Successful payment grants a bounded access period rather than pretending to be recurring billing.

Every provider reports one of the explicit health states defined by the billing registry. Missing credentials produce `NOT_CONFIGURED` and block checkout.

## Webhook handling

Provider events are:

1. read as an unmodified raw body
2. cryptographically or remotely verified
3. mapped into the internal state model
4. rejected when they cannot be linked to a user
5. recorded by provider and event ID
6. ignored on duplicate delivery
7. persisted and audited

## Persistent user data

Supported user buckets:

- watchlists
- workspaces
- alerts
- saved searches
- preferences

The account interface exposes local count, server count and explicit push, pull and merge actions. Existing local data is not silently overwritten.

## Administration

Admin endpoints expose:

- user count
- active users over 30 days
- subscription count and plan/state mix
- billing provider readiness
- user search
- role and account-state changes
- manual subscription grants
- audit event inspection

All modifying actions require both a privileged role and valid CSRF token.

## Security headers

The HTTP layer emits content-type protection, frame denial, restrictive referrer and permissions policies, a content security policy and production HSTS.

## Main API routes

```text
GET  /api/auth/session
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/account/profile
POST /api/account/password
GET  /api/billing/plans
GET  /api/billing/subscription
POST /api/billing/checkout
POST /api/billing/webhooks/:provider
GET  /api/user-data/:bucket
POST /api/user-data/:bucket
GET  /api/admin/metrics
GET  /api/admin/users
GET  /api/admin/audit
POST /api/admin/users/:userId/role
POST /api/admin/users/:userId/status
POST /api/admin/users/:userId/subscription
```

## Verification coverage

Part 7 tests cover account registration, login, logout, lockout-related state, password hashing, role ordering, subscription transitions, plan fallback, atomic persistence, CSRF rejection, user-data limits, admin authorisation, manual grants, Stripe signatures, Coinbase signatures, CDP JWTs, provider health, event mapping and webhook deduplication.
