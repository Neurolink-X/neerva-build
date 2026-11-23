# Neerva Build — STEP 0 launch-readiness audit and role QA plan
Audited: 2026-11-23. Source: GitHub main, Vercel Neerva project, dedicated Supabase djgghisbkucprqiezrcn. No fake fixture data in public pages. Evidence is not a certificate of launch readiness.

## Gates and severity
- P0: customer privacy / authorization, fake-confirmed transaction, nonfunctional key journey, lost orders
- P1: broken onboarding, mobile accessibility, PWA/offline, incorrect policy/SEO
- P2: reporting completeness, performance optimization, advanced business features
- No unverified release marked GO. All negative tests must fail closed; never seed real dealers, ratings, GMV, prices or invoices.

## Role-by-role test matrix (expected → evidence)
| Role | Happy-path test | Negative/abuse test | Current status |
|---|---|---|---|
| Guest | Home → plot sizes 18×50/20×45 → 3D concept → material spec → local basket → quote page | Invalid dimensions; quote without verified identity; APIs unauthorized | Concept and browser smoke passed prior PRs; real quote BLOCKED |
| Customer | Email signup and confirmation → login → RFQ create → own inbox → offer accept → order → tracking → invoice → reorder | Bad credentials, expired OTP, duplicate idempotency, spam, own-vs-other RFQ and quote access | Account page placeholder; offers and order flow BLOCKED |
| Contractor | Verified login → bulk BOQ → compare → RFQ → repeat request | Can't view other contractor project; role-limited API | Dedicated workflow NOT IMPLEMENTED |
| Dealer | Signup → shop/GST/KYC → admin approval → invite inbox → validated itemised offer → inventory → dispatch OTP → invoices/payouts | Two dealers' isolation; unapproved provider blocked; forged totals; malicious CSV; direct URL | Read-only inbox, submit blocked, 0 verified tenants; BLOCKED |
| Delivery partner | Verified invitation → assigned job → accepted → proof and one-time OTP | Different partner's job, replayed OTP, early completion | NOT IMPLEMENTED |
| Admin super | Verified email + role grant → approvals → catalog and prices → disputes and incident audit | Nonadmin access 401/403, role escalation, write bypass, audit evidence | Some guarded APIs; dynamic full operations BLOCKED |
| Admin catalog/design | Draft → review → publish → user-site realtime refresh | Other roles cannot approve/publicise | UI partial; live DB propagation unverified |
| Admin support | Own support queue, RBAC actions logged | No finance payout or privilege grant | NOT IMPLEMENTED |
| Admin finance | Reconcile ledger/invoices/refunds | No catalog editing or privilege grant | NOT IMPLEMENTED |
| Every role | Android 360/390/430, tablet 768, desktop 1440; touch ≥44px; keyboard; a11y/contrast; Hindi+English; account loading/empty/error | No console errors, no horizontal overflow, stale / offline, wrong city, malformed API | Mobile smoke covered selected guest routes; live Lighthouse and authenticated QA NOT MEASURED |

## Verified blockers before code changes
| ID | Priority | Finding | Concrete evidence | Fix + regression test |
|---|---|---|---|---|
| B01 | P0 | Account route shows static “Sign-in is being prepared” instead of existing AccountAccess component | src/app/account/page.tsx | Wire real auth UI; sign-in/signup/magic-email negative and disabled states |
| B02 | P0 | Public RFQ requires Upstash, Turnstile and privileged key, none of which are present in Vercel environment | /api/rfqs + project env listing | Replace with verified-session/DB-backed validated path, DB limit + idempotency; test 401/400/429 and RLS |
| B03 | P0 | Order routes only proxy optional Spring Boot ORDER_SERVICE_URL; no Vercel value | src/modules/orders/backend.ts; envs | Do not pretend to fulfil orders; explicit 503 until verified service and E2E |
| B04 | P0 | Dealer POST offer returns notReady; no verified dealer, tenancy or RFQ | src/app/api/dealer/quotes/route.ts; database counts 0/0/0 | Implement only with two-tenant tests, approval and offer validation; otherwise clear pending state |
| B05 | P0 | No payment/order/dispatch/OTP/payout tables verified in current four migrations | Database table inventory 29 tables | Implement later transactional schema and admin safety, test isolation, then enable by flag |
| B06 | P1 | Missing manifest/service worker/install prompt | repository tree | Offline-safe PWA shell + opt-in deferred prompt; browser lifecycle tests |
| B07 | P1 | Site uses remote Unsplash/Pexels photography for hero | src/modules/home/assets.ts | Make licensed/local owned concept artwork before public marketing; label accurately; screenshot review |
| B08 | P1 | Search indexing gated; SEO robots and sitemap need production/staging alignment | src/app/layout.tsx, robots.ts, sitemap.ts | Noindex preview, allow only verified production; canonical/OG/robots tests |
| B09 | P1 | Two SECURITY DEFINER auth functions externally executable; performance advisor reports unindexed FKs | Supabase advisers | Revoke extraneous grants/route functionality via safer schema and test actual role queries |
| B10 | P1 | No dedicated privacy terms/refund/dealer policy with legal review | /privacy preliminary; terms route absent | Draft honest preliminary information and legal review check; never claim legal compliance |
| B11 | P1 | Vercel deployment quota 402 due to excessive builds | Earlier deployment API | Reduce push churn; exact deployment and domain alias verify, no paid workaround |
| B12 | P2 | No trustworthy GMV/CAC or merchant analytics data | 0 tenants/RFQs in live DB | Report “insufficient data,” only calculate from actual records, no fake dashboard |

## Required per-fix evidence
Test definition → API/schema contract → negative RLS/auth/abuse → UI empty/error/success → screenshot at 360/390/768/1440 → lint/typecheck/unit/build → independent mobile E2E → deployment smoke. No screenshots or performance numbers are claimed unless generated and reviewed.

## Launch gates
1. Independent two-customer/two-dealer live RLS and privilege escalation evidence, real verified domain/email provider.
2. Quote offer → accept → persisted order → fulfilment/tracking/invoice/refund fully transactional; no demo transactions.
3. KYC/storage, GST validation and payouts personally reviewed by admin; legal/CA review of DPDP/consumer and invoicing claims.
4. Mobile accessibility and real Lighthouse scores at production site after deployment, PWA install testing on actual iOS+Android devices.
5. Production deploy READY on approved commit + smoke checks + rollback candidate, and no unknown live data access.
