# NEERVA BUILD

India-first construction materials marketplace, dealer SaaS and home planning platform. The project is an independent modular monolith; it does not share application code, data, credentials or infrastructure with AuroWater/AuroTap.

## Current foundation milestone

- Independent Next.js App Router application on `feat/platform-foundation`.
- Product requirements, acceptance criteria, architecture, tenant/data model, roadmap and release gates are in [`docs/`](docs/).
- Public catalog discovery and area conversion are implemented without inventing live prices or dealer verification.
- Quote-only material categories are designed to omit public amount fields at the API boundary.
- The Knowledge Hub has a bilingual, source-linked first buying guide with per-article metadata and sitemap entries.
- A Supabase migration establishes tenant-aware marketplace tables and row-level policies. No live backend is connected until separate Neerva credentials are configured.

## Stack

Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS 4, Zod, PostgreSQL/Supabase, Upstash rate limiting and Cloudflare Turnstile. Versions are pinned in `package.json`. Node.js 24 is the project runtime target.

## Local setup

1. Install Node.js 24 and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add credentials from a **separate Neerva** Supabase/Upstash/Turnstile project when ready.
4. Run `npm run dev`.

The public catalog and calculator can render without credentials. RFQ submission deliberately returns a clear service-unavailable response until Supabase, Upstash and Turnstile are configured; it must not pretend to save an enquiry.

## Commands

- `npm run dev` — local development
- `npm run lint` — ESLint
- `npm run typecheck` — strict TypeScript check
- `npm test` — domain and content unit tests
- `npm run build` — production build

## Repository documents

- [Product requirements and acceptance criteria](docs/product-requirements.md)
- [Architecture and module map](docs/architecture.md)
- [Database and tenant isolation](docs/database-and-tenancy.md)
- [Roadmap and dependencies](docs/roadmap.md)
- [Test plan and release gates](docs/test-plan.md)
- [API and operations notes](docs/operations.md)

## Safety and pricing rules

- Amounts are integer paise internally. Format INR only at the presentation boundary.
- Do not expose fixed public price rows for categories marked `quote_only`.
- A customer order must retain an immutable accepted-price snapshot.
- No price, inventory, dealer verification, delivery ETA, review or compliance claim is represented as live unless backed by current records.
- Tenant identity must be resolved server-side from a verified domain mapping. Never trust a client-supplied tenant ID.
- Architectural layouts are conceptual until reviewed by qualified professionals and applicable local authorities.

## Deployment status

This foundation and public Knowledge Hub are not the full revenue MVP. Configure a dedicated Supabase project, apply and verify migrations, connect Vercel to this repository, add secrets through the host's secret store, complete authentication/catalog/pricing/order journeys, set up separate analytics/error monitoring, and pass all CI gates before a public commerce launch.
