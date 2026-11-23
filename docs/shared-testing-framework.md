# Neerva shared release validation matrix

**Scope:** All customer, contractor, dealer, dealer staff, admin and design studio flows.
**Current infrastructure:** GitHub is authoritative for source. Dedicated Neerva database and staging credentials are NOT provisioned. Do not report database/E2E workflows as tested until deployment fixtures and approved data exist.

| Layer | Purpose and acceptance | Evidence / automated gate | Status |
|---|---|---|---|
| Context | Product choice and colour previews should lead to a comprehensible quote, not fabricated offers | Product/detail content and exact quote-only labels in domain + browser checks | Partial |
| Roles | Customer creates quote; dealer responds only to own tenant; admin alone manages platform | permissions.test.ts and server JWT/RLS boundaries | Unit covered; live RLS pending |
| Execution | Click material -> choose spec -> local planning list -> quote; choose wall colour -> original/preview | mobile-smoke.mjs runs 390 px interactive workflow | Automated local browser smoke |
| Positive/negative | Correct quantity/grade, empty/full list, invalid inputs, storage failures, no fake price | planning-list.test.ts + interactive mobile smoke | Unit/browser |
| Integration | Materials, basket, quotes, studio and existing routes still work | Next build and regression flow in protected PR CI | Partial |
| Security | JWT authentication, dealer tenant isolation, admin checks, private price and images, RLS deny cross-tenant | role tests and unauthenticated API smoke; authenticated 2-tenant DB test pending | Block production until DB evidence |
| Performance | Cached static assets, API timings, unnecessary roundtrips and real CWV | Mobile lab audit and instrumented staging/production, p75 LCP<=2.5s, INP<=200ms, CLS<=0.1 | Not measured on this PR |
| Real E2E | Customer signup -> RFQ -> dealer offer -> order -> tracking; admin KYC/publish | Requires isolated staging auth, seeded two-tenant DB and protection-aware browser credentials | **Blocked: no Neerva DB** |
| CI gates | npm ci -> lint -> strict TypeScript -> unit -> production build -> mobile browser smoke | ci.yml and mobile-regression.yml; branch protection must require BOTH | Implemented workflows; protection not verified |

## Source-of-truth rules
1. Do not publish prices, inventory, GST verification, municipal setbacks or architect plans until verified. Aggregates/morang/sand remain quote-only.
2. Each UI action must have an API contract, DB transaction where applicable, auth, successful response UI, failure/timeout/duplicate path, telemetry and test.
3. No backend with privileged credentials in the client. Supabase JWT authorization and RLS must be proven with *two separate tenant accounts* before enabling order or onboarding.
4. Keep source parity attestation separate from CI. The Vercel ignored-build command should only green-light a production SHA after full Phase 1 route, asset and state reconciliation has been signed off.
5. For each production release keep: commit SHA, CI run URL, preview URL, migration version, staging test evidence, approval, production alias, rollback candidate and post-release error scan.
6. A GitHub merge, Vercel READY state, or UI screenshot alone **does not prove** authenticated database flows work.

## Manual staging test checklist (required before an authenticated release)
- [ ] Two distinct customers, two dealers/tenants, admin and rejected dealer; role separation across APIs and DB RLS.
- [ ] Dealer registration, GSTIN invalid/duplicate, shop photo uploads, approved-only catalog visibility, pin matching.
- [ ] CSV malicious/empty/partial import, error report and atomic price state.
- [ ] Quote create, duplicate idempotency, dealer invite, offer taxes/freight, expiry, accept, order lifecycle.
- [ ] Admin price publication propagation, out-of-date data, error logs and auditing.
- [ ] Design Studio plot warnings, colour/photo selection and content accuracy; no invented architecture approval.
- [ ] Offline/stale-cache/error/loading states, storage blocked or quota exhausted.
- [ ] Mobile 360/390/430/768/1440 viewports, no console error, keyboard and Hindi text layout.
- [ ] DB migration forward checks, read-only backup/restore drill, stress/concurrency and RLS security advisors.
- [ ] Verified domain alias points to approved commit and rollback is available.
