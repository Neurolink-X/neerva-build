# API and operations notes

## Current public endpoints

### `GET /api/catalog`

Returns public catalog categories. It must not include dealer private data or prices unless backed by current published database records. Quote-only categories have no `amount`, `price` or price-range field.

### `POST /api/rfqs`

Accepts a bounded RFQ payload. Validates with Zod, verifies Cloudflare Turnstile, applies distributed IP/device rate limits, writes through a server-only Supabase client, and returns a non-sensitive request reference. Until all required environment variables are configured, returns HTTP 503 with a clear retry message; it does not claim the enquiry was saved.

## Environment

See `.env.example`. Production secrets are configured in deployment secret storage only. `SUPABASE_SERVICE_ROLE_KEY`, Upstash token and Turnstile secret are server-only. Never add them to `NEXT_PUBLIC_*`, source control, screenshots or logs.

## Incident logging

Log event code, module, severity, trace ID, safe route, status and timestamp. Strip authorization/cookie headers, phone/address, query payloads and payment data. Aggregate duplicates and cap retention. Admin-only incident pages will read sanitized records through a permission-gated API.

## Recovery and rollback

Use ordered, forward-safe SQL migrations, take a database backup before production migrations, and rehearse restore on staging. Roll back application deployment independently; do not reverse confirmed orders or accepted price snapshots. Price configuration rollback creates a new audited version.
