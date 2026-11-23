# NEERVA BUILD — launch-readiness QA report

**Date:** 2026-11-23
**Status:** NO-GO for a public paid construction marketplace. This report is not a claim of finished/working orders.
**Repository:** Neurolink-X/neerva-build — PR #19.
**Environment:** Supabase project `djgghisbkucprqiezrcn` (Mumbai). Vercel production was last verified as still serving older commit `585da084`; daily deployment quota returned 402 on attempts to deploy later commits.

## Verified facts
- Dedicated Supabase project HEALTHY, migrations 0001–0006 applied; 29 earlier public business tables had RLS enabled. No merchants or RFQs have been entered into the production project.
- Database `quote_requests`: authenticated users have limited INSERT column permissions; anon has no table INSERT; changing `status` or `created_at` from a client is denied by PostgreSQL privileges. Triggers enforce verified email, per-user throttle, consent and audit logging. Evidence: Supabase SQL metadata query and migration 0005/0006.
- Account page in PR #19 uses existing `AccountAccess` and optional email magic link; phone OTP remains feature-gated and requires a real SMS provider.
- Public RFQ intake is **OFF by default**. Once operator activates both server and frontend flags after merchant/legal support readiness, requests require JWT and consent; no Upstash, paid redis, external CAPTCHA or service-role credentials.
- PWA contains generated local PNG icon routes, maskable manifest declaration, safe offline fallback, install engagement/cooldown; installed-state / Safari prompt behavior requires real devices.
- Homepage hero now uses **original illustrated construction/finished concept art**, not a photo of a real Neerva house. Other illustrative photographs may still be sourced from free-license providers.
- Preview indexing remains disabled; production requires explicit `NEXT_PUBLIC_SITE_INDEXABLE=true` and HTTPS URL, without which robots/sitemap block indexing.
- Critical application functions still absent: approved dealer quote POST, order persistence/service, payment, delivery tracking, invoice, payout/ledger, contractor and driver home, dispute/refunds, real verified commercial data.

## Test status per role

| Persona/test | What is actually covered | Result / launch gate |
|---|---|---|
| Guest | Home / custom plot 18×50 and 20×45 / materials → local basket / photo colour / PWA routes | CI browser smoke exists, final current-run outcome must be checked on GitHub; no real transaction |
| Customer authentication | Route wires Supabase email/password + magic link; safe unconfigured fallback | Code + build; **real email delivery, signup/session expiry NOT VERIFIED** |
| Customer RFQ | Server schema, privacy checkbox, owned insert, SQL throttling/idempotency/audit; anonymous negative | Unit + database metadata + browser negative; **currently OFF by safety flag, real two-customer POST NOT VERIFIED** |
| Contractor | No distinct authenticated workflow implemented | **FAIL — missing feature** |
| Dealer | API role guard requires active tenant; domain negative tests for suspended/unapproved merchant | Unit; **FAIL — no approved dealers, no KYC workflow or offer submission** |
| Delivery | No delivery identity, assigned job, OTP or proof handling | **FAIL — missing feature** |
| Admin super/catalog/support/finance | Partial guarded read-only API and view shell; administrator login not validated | **BLOCKED — no authenticated role matrix** |
| PWA | Manifest, offline HTML, SW excludes authenticated/API pages, install lifecycle | Automated route assertions + code review; **real Android/iOS install NOT VERIFIED** |
| Security | RLS enabled, SQL allowlists, denial behavior, role unit logic | Partial PASS; **real cross-tenant tests pending** |
| SEO | Noindex preview, local OG endpoint, sitemap and robots policy | Unit/build PASS; indexing should stay OFF until final review |
| WCAG/accessibility | Automated axe WCAG 2.x A/AA baseline in mobile CI at 390px, screenshots 360/430 | **Report artifact must be inspected; manual WCAG AA audit NOT DONE** |
| Lighthouse mobile | No validated run on target live domain after this release | **NOT MEASURED — do not claim 90+** |
| Payments / GST / DPDP | Draft policies; no payment is accepted through this flow | **NO-GO until lawyer/CA, provider config, merchant verification** |

## Screenshots and artifacts
- GitHub Actions workflow **Neerva mobile browser regression** uploads `neerva-mobile-visual-evidence` (7-day retention): guest screenshots at 360/430 and unauthenticated customer/dealer/admin shell screenshots at 390, plus `accessibility-baseline.json` from axe.
- GitHub CI: `lint`, TypeScript, release contract, unit tests, Next production build, and isolated mobile browser E2E.
- These screenshots are NOT proof of real authorised customer/dealer/admin transactions; none are fabricated.

## Fixed issues in this PR
1. B01: static account screen replaced with actual auth component, passwordless email option and provider-gated SMS.
2. B02: blocked Redis/Turnstile RFQ replaced with verified-auth, transactional DB rate limiter and audited RLS flow.
3. B06: native install/offline PWA foundation implemented without private-page caching.
4. B07: remote hero replaced with original matched, openly illustrative concept artwork.
5. B08: robots/sitemap/canonical and OG linked to explicit launch indexing policy.
6. B09 partial: pending merchant cannot enter dealer dashboard on mere membership, with negative unit tests. Two privileged RLS helper advisor warnings remain and require an isolated security review.
7. B10 partial: honest draft informational privacy, terms and refunds pages + explicit consent. Not final legal policies.

## Remaining release blockers
1. Real commercial dealer onboarding + KYC, verification and approval.
2. Two real, independent, verified account fixtures (customers/dealers) to test owner/tenant RLS and abuse.
3. Quote offers, acceptance, orders/dispatch/OTP, invoices, refunds and payouts built as transactions; no fake paid order.
4. Phone SMS provider and domain-bound production email sender, including verification + rate limits.
5. User/role-specific dynamic admin UI with real audit trails and propagation checks.
6. Real device PWA install, proper WCAG AA remediation, Lighthouse mobile 90+ measurement and Core Web Vitals sample.
7. Lawyer/CA-reviewed privacy, consumer, dealer terms, GST and grievance contact.
8. Vercel quota must clear and approved commit must be production READY and aliased; verify rollback and live errors.

## Kanpur pilot decision
**GO** for internally reviewing design concepts and material catalog with factual limitations. **NO-GO** for collecting real paid orders, promising availability, onboarding dealers without KYC review or allowing payment transactions.

## Evidence standards
Never report a role as PASS from a UI screenshot alone. Require positive and negative authenticated API evidence, correct tenant isolation, measured mobile performance, confirmed merchant inventory/terms and a verified production alias.

## Operator activation guard
The customer RFQ intake toggle is deliberately disabled until real approved dealers, staffed customer support, a verified email sender, legal/privacy signoff and authenticated RLS E2E tests are complete. Enable only **both** `NEERVA_RFQ_INTAKE_ENABLED=true` (server) and `NEXT_PUBLIC_RFQ_INTAKE_ENABLED=true` (client) for the approved production environment, then redeploy and inspect the actual database write + audit logs. The default disabled value prevents an accidental collection of real contact data during an incomplete launch.
