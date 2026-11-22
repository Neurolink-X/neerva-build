# Architecture and module map

## Runtime shape

```text
Browser / PWA
  └─ Next.js App Router (SSR public pages, client islands for interaction)
       ├─ Route handlers / server actions (Zod validation, authz, idempotency)
       ├─ Modular application/domain modules
       ├─ PostgreSQL / Supabase (RLS, transactions, migrations)
       ├─ Supabase Auth and tenant-scoped Storage
       ├─ Upstash (distributed limits, short-lived coordination only)
       └─ Cloudflare (DNS, TLS, CDN, Turnstile)
Vercel: independent Neerva deployment, environment and analytics
```

Keep one deployable modular monolith. Extract a service only when measured scale, isolation or team ownership makes a separate runtime cheaper and safer.

## Module boundaries

| Module | Owns | Depends on |
|---|---|---|
| identity-access | user profiles, role grants, permission checks, verification state | Supabase Auth, audit |
| tenancy | tenants, verified domains, tenant resolution, entitlements | identity, database |
| catalog | categories, brands, variants, technical attributes, media references | tenancy, pricing read model |
| pricing | published rules, approvals, tax/freight inputs, price history, snapshots | catalog, merchant, audit |
| inventory | branch stock, reservations, movements | catalog, merchant, orders |
| rfq | private requests, dealer offers, revisions and expiry | identity, tenancy, catalog, pricing |
| commerce | cart, order state machine, payment intents, fulfilment, invoices/refunds | pricing, inventory, payments |
| merchant-ops | dealer onboarding, branches, staff, dashboards and settlements | identity, tenancy, commerce |
| design-studio | projects, plots, curated plans, versions, design assets | identity, storage, catalog |
| education-calc | unit conversions, transparent estimates, guides | catalog read-only |
| cms-seo | public pages, metadata, structured data and sitemaps | catalog, tenancy |
| notifications | transactional email/in-app/outbound preferences | event outbox |
| platform-ops | audit, incidents, feature flags and admin reporting | all modules through safe read APIs |

Modules call application interfaces, not each other's database tables arbitrarily. Shared infrastructure is limited to database, auth, storage, logging and event outbox adapters.

## Code layout

```text
src/app/                   routes, layouts, route handlers
src/modules/<module>/      domain, application, infrastructure, ui
src/infrastructure/        Supabase, Redis, logging, environment parsing
src/components/            design-system primitives only
supabase/migrations/       ordered SQL migrations and RLS policies
docs/                      product, architecture, data, operations, tests
```

## Security and trust boundaries

1. Public requests are untrusted. Parse input with Zod and cap request/file sizes.
2. Resolve session and role server-side. Map role grants to explicit permissions.
3. Resolve tenant only from a verified host/domain mapping; cache keys include the verified tenant ID.
4. Use a least-privilege database client for user-bound reads/writes so RLS is active. A service-role client is server-only and limited to vetted jobs such as Turnstile-verified anonymous RFQ intake.
5. Dealer quote rows are never public and never exposed across merchant IDs.
6. Do not log phone numbers, payment tokens, document contents, passwords, or raw secret-bearing headers.
7. Webhooks must verify signatures and use unique provider event IDs for idempotency.

## Pricing design

All money values are integer paise, not floating-point rupees. A single pricing service resolves product + variant + merchant + city/zone + quantity + effective window + discounts + applicable tax/freight configuration. It emits a calculation trace and a versioned immutable snapshot. Browsing sees only current published prices. Quote-only categories have no amount in public response types. A price changed after carting requires explicit customer acceptance before order creation.

## Cache and realtime

Cache only public, published catalog/pricing read models. Tag cache entries by category, city and pricing version. Publishing triggers targeted invalidation. Use realtime subscriptions for active price/editor views; reconnect with last-updated cursor and a bounded stale-data fallback. No permanent high-frequency polling. Never cache private quote/order responses across users or tenants.

## Hosting and integrations

Start with a private repo, dedicated Supabase project, independent storage bucket, isolated Vercel project, Cloudflare DNS/TLS/Turnstile, separate error monitoring and analytics properties. Free tiers are a launch experiment, not a production SLO or data-retention guarantee. Confirm plan limits and terms before production traffic. Payment, tax, legal and domain setup require configuration and review; code scaffolding is not a live integration.
