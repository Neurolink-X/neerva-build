# Test plan and release gates

## Test layers

| Layer | Required evidence |
|---|---|
| Domain unit | Unit conversions; price rules/rounding/discount floors; no public amount for quote-only; state transitions; permission matrix |
| API integration | Zod boundary; auth and role checks; idempotency; price recalculation; safe error mapping; rate limits; Turnstile failures |
| Database/RLS | Anonymous public catalog; customer own rows; dealer own tenant only; cross-tenant denial; quote privacy; service-role isolation; migration forward/rollback checks |
| Browser E2E | Visitor search/calculator; customer quote/order; dealer offer and fulfilment; admin publish/incident; tenant host resolution |
| Reliability | Stale cache invalidation; realtime reconnect; duplicate webhook; stock race; DB/API outage; retry and safe degraded state |
| Security | Price tampering; privilege escalation; cross-tenant IDOR; upload type/size; XSS; CSRF where relevant; secret leak scan |
| UX/accessibility | Keyboard navigation, screen-reader labels, Hindi rendering, mobile breakpoints, color contrast, stable layout |
| Performance/SEO | Mobile CWV field targets; bundle budget; SSR; no private-page indexing; sitemap/metadata/structured-data validation |

## Current foundation tests

The current unit suite covers square-gaj conversion, 20×40 ft area, invalid dimensions, quote-only amount omission, public paise serialization, RFQ schema boundaries, and safe/deterministic incident catalog fingerprints. These are domain tests only; no DB/RLS, API integration, browser E2E, accessibility, load, or payment tests have run yet. CI uses `npm ci`, lint, strict TypeScript, unit tests and production build. SQL migrations are not currently applied or parsed in CI.

## CI gates

Current pull requests run ESLint, strict TypeScript, unit tests and production build. Formatting, API/database integration, migration validation, dependency/security scanning, accessibility checks, browser console checks and E2E are pending CI additions. A failed configured required check blocks merge/deploy; branch protection must be enabled in repository settings. Store the run URL/commit SHA as release evidence; do not report tests passed without a run.

## Launch release gate

Require all required CI checks green, staging smoke tests, RLS proof, verified merchant coverage in the target area, current supplier pricing/stock process, payment webhook idempotency, customer support and refund workflow, backup/restore evidence, monitoring alert test, and reviewed Indian tax/legal/consumer obligations. Lighthouse scores are lab signals; real-user Core Web Vitals targets are measured at the 75th percentile after traffic exists.
