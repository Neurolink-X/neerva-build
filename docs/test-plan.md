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

The first code milestone should prove: `1 square gaj = 9 square feet`; square units do not convert as linear units; quote-only price serialization omits all amounts; published price serializes paise only for public listings; malformed and oversized quote payloads are rejected.

## CI gates

Every pull request runs formatting, ESLint, strict TypeScript, unit/integration tests, migration checks, production build, basic dependency/security scan, accessibility checks and browser console/E2E smoke tests. A failed required check blocks merge/deploy. Store the run URL/commit SHA as release evidence; do not report tests passed without a run.

## Launch release gate

Require all required CI checks green, staging smoke tests, RLS proof, verified merchant coverage in the target area, current supplier pricing/stock process, payment webhook idempotency, customer support and refund workflow, backup/restore evidence, monitoring alert test, and reviewed Indian tax/legal/consumer obligations. Lighthouse scores are lab signals; real-user Core Web Vitals targets are measured at the 75th percentile after traffic exists.
