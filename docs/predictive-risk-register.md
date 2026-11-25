# Predictive risk register — 2026-11-25
These are risks, not reported production incidents. No production data or permissions changed.
| Area | Existing controls and this change | Outstanding validation |
|---|---|---|
| Auth | JWT getUser, account access RPC, role gates; separate session expiry from outages | Real expired session and 429/5xx integration |
| Admin/dealer | RLS, explicit tenant/role filters, fixture tests | Execute authenticated tests; restricted and suspended identities |
| Inventory | Nonnegative stock, tenant/unit checks; orders are RFQ acceptance, not stock reservations | SKU-linked reservation design required before instant checkout; never imply availability is guaranteed |
| Orders | Unique RFQ/key, row lock, expected status; reject address-changing idempotent retry | Concurrent accepted-offer and transition tests |
| Payments/refunds | Unique UTR, review RPC row lock, atomic entitlement changes | Claim-versus-cancel interleaving, checkout/refund race, real reconciliation |
| Catalog/media | Draft-only import, explicit published identity, local reviewed photos | PR 56 must pass; rights and all media coverage need review |
| Design | Canonical PlanModel, adapter and geometry tests | Cross-size/floor/orientation browser execution |
| Colour | Header-based 16MP decode budget, 1280px retained bitmap, stale request and cleanup guards | Real low-memory devices, malformed/animated files and rapid selection |
| Pincode | Exact service-area checks at quote acceptance, validated delivery policy | Cross-dealer/unsupported PIN and stale coverage tests |
No stock reservation, automatic settlement or certified architectural drawings are introduced by these changes.

Extended disposable regression suite: concurrent Studio checkout and UTR submissions, cancellation after claim, duplicate refund, entitlement revocation, malformed PINs, invalid and stale direct-order transitions. These tests are configured, not yet executed. Claim-versus-cancel at exactly the same instant still needs a reviewed database locking migration; stock reservation requires explicit SKU/branch linkage and fulfillment semantics.

## Next candidate: Studio concurrency
A transaction-locking SQL candidate is in scripts/ops/studio-concurrency-candidate.sql, rehearsed only on the disposable local database before the reliability suite. It serializes checkout and admin review per account/product, locks the same order row for claim/cancel, validates claim time and ownership inside the database, and refuses refund if the matching active entitlement is missing. The regression checks the persisted outcome of concurrent claim/cancel. This is not a deployed migration, nor bank reconciliation. Supabase CLI is unavailable in the current environment; generate a tracked migration after staging tests and review. Existing inconsistencies must be reconciled, not overwritten.

## Stock reservation candidate
Added isolated SQL candidate for explicitly mapped RFQ order lines, validated seller branch/service PIN, atomic conditional stock decrement, deterministic row locking, holds, pre-dispatch cancellation release, dispatch consumption, and bounded admin expiry. Existing unmapped orders remain sourcing/confirmation requests and are not stock guarantees. Requires staging concurrency fixtures, reviewed SKU selection UI/API, expiry scheduling and a tracked migration before activation. Expired holds currently require manual order reconciliation; archived SKU release and stale stock-editor behavior require staging validation. Do not deploy the candidate directly.

## Catalog reconciliation
Read-only exact slug/category/origin/reference-SKU/unit/status reconciliation and unit tests are now linked to the disposable import workflow. Conflicting rows and missing or orphan reference records are reported, not overwritten or published. Production run requires a verified database connection and does not synchronize records by itself.

## Atomic confirmation integration
Opt-in server flag NEERVA_ATOMIC_STOCK_CONFIRMATION=true enables the dealer exact-SKU mapping UI/API. In the candidate DB, reserve and confirm occur in one transaction; no new standalone pending reservations can be created, eliminating the need for a new scheduled expiry job for this flow. Existing pending-hold cleanup remains bounded and admin-only. Legacy admin/dealer manual confirmation remains unchanged until the flag and reviewed DB migration are coordinated. An activated candidate blocks bypass via direct order status updates. Dealer must explicitly verify the exact product; a unit match alone is not identity proof. Direct sourcing requests remain non-guaranteed. No production activation.

Added disposable real RFQ → invite → offer → accept → simultaneous stock confirmation tests with two independent customers, role and direct database bypass rejection, cancellation release exactly once and no restock after dispatch. Authentication read-only operations can refresh once on explicit 401; writes are not automatically retried. No per-order flag polling. Remaining: test execution, archived variant release and real coverage/rights review, approved migration and production rollout.
