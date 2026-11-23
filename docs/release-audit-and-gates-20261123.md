# NEERVA BUILD — audited release gates (2026-11-23)

**Scope:** isolated feature branch; no production changes, no live database changes, no paid tools.

## Role-by-role acceptance tests
| Role | Required tests | Current status |
| --- | --- | --- |
| Guest/customer | Plot geometry, four road directions, valid car and pedestrian entry, 2D/3D/elevation/BOQ reconciliation, materials search, quote empty state, Hindi/English, 360px | **Partial**; no full commerce |
| Dealer | Own KYC, own RFQs, itemised offers, CSV errors, stock, orders, delivery OTP, tenant separation | **Blocked** by backend readiness |
| Contractor | Correct signup, scoped projects/quotes, no dealer/admin data | **Not verified** |
| Delivery | Own assignments, OTP proof, order status only, no cross-tenant data | **Not verified** |
| Admin | RBAC for super/catalog/support/finance, audit log, publish validation, city rules, pricing, live updates | **Partial**; city approvals unverified |

## Verified blockers before changing code
1. Three incompatible planning systems remain: 24-design library, workbench, road-first PlanModel, plus plot-fit SVG. No single authoritative plan yet.
2. PlanModel explicitly stores N/E/S/W as metadata; 2D plots all orientations with the road at top. No real compass transform shared across 2D/3D/elevation.
3. 18×50 ground-floor 2BHK is rejected. 15×30, 20×40, 25×40, 30×40, 30×50, 40×60 have no verified candidate families.
4. Two mirror variants only; no third topologically distinct plan. Do not claim 24 validated distinct designs.
5. Existing 3D has approximate slab, stairs and parapet; facade SVG is conceptual, not engineered.
6. No city-authority-approved setbacks/FAR/parking/stair rules. Zero setback is explicitly a placeholder, never legal clearance.
7. Room-floor and paint quantities exist; structural steel/cement/brick BOQ does not. Do not display fabricated pricing.
8. Dealer backend/quote intake has intentionally disabled states; do not claim order tracking/invoice is live.
9. Home materials-first content, TMT imagery, colour editor and PWA need independent accessibility and mobile audits.
10. Release gate / Vercel ignored-build policy may block production independently of passing CI; do not bypass.

## Implementation order and acceptance
- Gate A: common compass transform and deterministic tests for all N/E/S/W orientations; all existing tests pass.
- Gate B: consolidate legacy plan data into PlanModel with per-design validation; unpublished if any rule fails; no fake published counts.
- Gate C: three actually distinct feasible 18×50 variants, G/G+1 and 2/3 BHK; only proceed when all validation passes.
- Gate D: all listed plot sizes, city-specific rules verified by a licensed professional.
- Gate E: full derived 2D, Three.js, elevation, structural BOQ, paint, 24+ unique designs, materials-first home.
- Gate F: customer/dealer/admin/RBAC/PWA and 360px/AA/Lighthouse/e2e gates; screenshot evidence and preview approval.

**Fail closed:** a failed validation stays draft; an absent backend stays unconfigured; noindex remains on preview. Production merge requires explicit user approval.
