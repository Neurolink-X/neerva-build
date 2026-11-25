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
