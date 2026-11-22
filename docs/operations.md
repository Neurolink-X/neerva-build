# API and operations notes

## Current public endpoints

### `GET /api/catalog`

Returns public catalog categories. It must not include dealer private data or prices unless backed by current published database records. Quote-only categories have no `amount`, `price` or price-range field.

### `POST /api/rfqs`

Accepts a bounded RFQ payload. Validates with Zod, verifies Cloudflare Turnstile, applies distributed IP/device rate limits, writes through a server-only Supabase client, and returns a non-sensitive request reference. Until all required environment variables are configured, returns HTTP 503 with a clear retry message; it does not claim the enquiry was saved.

## Environment

See `.env.example`. Production secrets are configured in deployment secret storage only. `SUPABASE_SERVICE_ROLE_KEY`, Upstash token and Turnstile secret are server-only. Never add them to `NEXT_PUBLIC_*`, source control, screenshots or logs. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin. Configure exact production and preview hostnames in `TURNSTILE_ALLOWED_HOSTNAMES`; a host mismatch blocks RFQ verification.

## Incident logging

`POST /api/rfqs` emits a bounded set of allowlisted incident codes for rate-limit, Turnstile, persistence and idempotency-confirmation failures. The server stores a stable fingerprint, module, safe summary, impact, fixed route, occurrence count, timestamps and last trace ID. It never forwards request bodies, phone/address fields, provider response bodies or raw stack traces. A report-write failure is swallowed so monitoring cannot break the customer request.

`GET /api/admin/system-incidents` requires a Supabase access token and checks `admin`/`super_admin` through the database role function before querying RLS-protected rows. This endpoint is the data boundary for the planned Admin → System Health & Errors screen; the authenticated admin UI and incident-resolution workflow are not implemented yet. Current incident codes cover RFQ only, not every platform module.

To enable reporting, apply migration `0002_incident_observability_and_tenant_constraints.sql` and configure the dedicated Neerva Supabase URL and service-role key. Monitor the incident insert function and alert if it fails. Add retention and resolution audit policy before production launch.

## Recovery and rollback

Use ordered, forward-safe SQL migrations, take a database backup before production migrations, and rehearse restore on staging. Roll back application deployment independently; do not reverse confirmed orders or accepted price snapshots. Price configuration rollback creates a new audited version.
