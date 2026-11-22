# Implementation roadmap and dependencies

## Foundation milestone (`feat/platform-foundation`)

1. Product requirements, acceptance criteria, architecture and tenant/security model.
2. Independent app shell and design system.
3. Public catalog discovery and safe pricing response boundary.
4. Unit calculator with tested feet/metres and square-gaj conversions.
5. RFQ validation endpoint with Turnstile, distributed rate limit and separate Supabase persistence configuration.
6. Initial schema migration and RLS policies.
7. CI workflow: lint, typecheck, domain tests, migration checks and production build.

## Phase 1 — Core revenue MVP

Order: infrastructure/configuration → identity and roles → dealer approval → catalog/admin → pricing publication → pincode coverage → inventory → cart/RFQ → order state machine → payment intents/webhooks → fulfilment/invoice/notification → customer/dealer/admin journeys → release tests.

Exit criteria: a real test customer can discover a supported item, receive current price or private quote, accept an itemized total, place an idempotent supported order, and track fulfilment. A test dealer can manage authorized catalog/stock/price/quote/order records. Admin changes are permission-checked and audited.

## Phase 2 — Business growth

Contractor projects and BOQ; multi-site purchasing; repeat orders; dealer analytics; storefront SaaS; subscriptions and invoices; verified custom domains; calculators and reviewed education content.

Dependencies: stable Phase 1 order/merchant model, payment reconciliation, tenant RLS, support operations and plan cost limits.

## Phase 3 — Design differentiation

Curated plot templates with explicit assumptions; same-size plan comparisons; save/version and professional review; 2D editor; lazy 3D; elevations; manual-first paint visualizer; image export; design-to-material estimates.

Dependencies: qualified design review, local setback/approval handling, rights-cleared assets, mobile performance budget and clear conceptual-design disclosures.

## Phase 4 — Evidence-led intelligence

Evaluate BOQ extraction, replenishment prediction, quote follow-ups, route optimization, ERP integration and AI customization only after real usage demonstrates value and quality/privacy requirements are met.

## Deployment gates

Separate Supabase/Vercel/Cloudflare/analytics/error-monitoring configuration; migrations applied to staging; secrets stored only in platform secret manager; CI all green; tenant isolation and public price leak checks pass; smoke-tested backup/restore; legal/tax/payment review completed; launch cities have verified dealers and actual delivery zones. Free tier assumptions must be checked against live provider plans before production.
