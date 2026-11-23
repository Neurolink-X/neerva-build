# Neerva Build — Design Studio Step 0: audited architecture and delivery gates

Date: 2026-11-23. Baseline: GitHub main `29757e7`. **Audit only: no application logic or production deployment in this commit.**

## Existing functionality to preserve
- Next.js frontend, premium homepage, 24 original JSON concept records, gallery, plan-led 3D with door/window void tessellation, colour controls, local saved concepts, paint area estimate, materials browsing and quote-preparation routes.
- Existing tests: library bounds/overlap/opening validation, 3D wall-cell geometry, smoke tests at mobile/tablet/desktop widths. Passing smoke tests are not proof of authenticated order processing.
- Production is not proven to serve the current Git main; verify deployment SHA and alias before any release.

## Verified audit findings
1. **Realism:** `src/components/studio-design-detail.tsx` renders `ConceptElevation` as an SVG facade, explicitly disclaimed as a vector concept. This is not a photorealistic image and must never be labelled one. Existing 3D is a plan study, not a substitute for architect-approved Blender renders.
2. **3D geometry:** `src/modules/studio/geometry.ts` generates wall cells and excludes openings; `studio-building-3d.tsx` adds roof/slabs. Thus “no openings/roof at all” is stale as an absolute claim. Remaining risks: shared wall joins, stair/roof plausibility, materials, camera clipping and mobile GPU budgets; verify visually on real devices.
3. **Plan fit:** `validateStudioDesign` rejects rooms outside the plot and same-floor overlaps, but lacks city-specific setbacks, parking turning clearance, minimum habitable sizes, access circulation and buildable-area feasibility scoring. `layout.ts` uses fixed default setbacks and simplistic room allocation; reject infeasible plans rather than shrinking rooms silently.
4. **Library:** 24 JSON concepts exist; **24 production-ready, multi-angle rendered designs do not**. No verified render/mask manifest, commercial licence evidence, asset version or admin publishing workflow is established.
5. **Paint:** `paintEstimate` deducts modeled openings, but has no verified brand shade card/coverage, primer/putty/wastage system, pack optimization, painter labour quotes or live dealer pricing.
6. **Commerce:** UI routes and protected read skeletons exist, but the complete authenticated RFQ fan-out, itemised dealer acceptance, transactional order/OTP tracking and GST invoice chain is not verified live. Do not expose a dead-end CTA as “order placed”.
7. **Homepage:** `premium-home.tsx` has the three journeys and a modern layout; live may still be an older Vercel deployment. Existing illustrative images must be identified as inspiration, not exact rendered designs. Audit bottom-nav safe areas, 360px wrapping, image LCP, language parity and CTA destinations before changing design tokens.
8. **Cities:** Kanpur and Ranchi are first operational targets. Lucknow/Jhansi/Mumbai SEO pages must not claim dealer availability before verified coverage.

## Architecture (reuse current modules, avoid parallel systems)
```
Next.js App Router (SSR design/catalog + lazy client studio)
  -> Studio domain (designs, plan feasibility, asset manifests, mask versions, paint system)
  -> Commerce domain (existing cart/quote/order API contracts; extend, never fork)
  -> Auth/RBAC (customer, contractor, dealer, delivery, admin subroles)
  -> PostgreSQL (transactional records, outbox, audit) + object storage (licensed images/masks)
  -> Spring Boot backend only if already deployed/connected; otherwise keep API adapter boundaries
```
- Public reads expose only published designs and verified prices. Admin writes require server-side session + role checks, schema validation and audit events. No browser-provided price/order status is authoritative.
- Keep assets in the website via optimised WebP/AVIF and versioned manifest. Do not use remote hotlinks as proof of ownership or plan fidelity.
- All changes in feature-specific commits/PRs, with migration + contract tests before any UI depends on new endpoints.

## Data model and migrations (proposed, not applied)
- `studio_city_rules`: city_code, authority, rule_version, setbacks, FAR, min room sizes, parking rules, effective_from, verified_by, verified_at, source_url, status.
- `studio_designs`: id, slug unique, plan_json, plot dimensions, facing, floors, style, status (draft/review/published), rule_version, created_by, published_by, version, timestamps.
- `studio_design_assets`: id, design_id, angle, image_key, width, height, license_source, license_proof_key, status, checksum, published_at.
- `studio_asset_masks`: id, asset_id, surface, polygons_json, feather_px, mask_version, editor_id, approved_at.
- `paint_products`: id, brand, tier, surface_type, finish, coverage_m2_l_coat, packs_json, verification_source, verified_at, status.
- `paint_shades`: id, product_id, shade_code, shade_name, approximate_hex, official_reference.
- `studio_saved_designs`: id, owner_id, design_id, design_version, selected_surfaces_json, consent_at, timestamps.
- `studio_estimates`: id, design_id, owner_id, rule_version, estimate_json, disclaimer, created_at; immutable estimate snapshots.
- `architect_leads`: id, owner_id nullable, consent_at, city, design_id, contact_encrypted, status.
- Reuse existing quote/order/dealer tables if present; only add a `quote_source`/estimate reference and idempotent `rfq_dealer_targets` if missing. Migration must inspect actual DB schema first.
- Every table: least-privilege RLS/service permissions where supported, scoped indexes, FK constraints, timestamps; audit log and transactional outbox for critical changes.

## API contracts (proposed, not implemented)
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | /api/studio/designs | public | Published only; filter plot/facing/bedrooms/style; pagination |
| GET | /api/studio/designs/:slug | public | Plan-derived areas and approved asset manifest |
| POST | /api/studio/feasibility | public/rate-limited | City rule version, space score, violations, alternatives |
| GET | /api/studio/city-rules?city= | public | Verified vs provisional flags |
| POST/PATCH | /api/admin/studio/designs | design admin | Draft/review/publish with audit |
| POST | /api/admin/studio/assets | design admin | Signed upload, MIME/size/license validation |
| PUT | /api/admin/studio/assets/:id/masks | design admin | Versioned polygons, image-space coordinates |
| GET | /api/studio/paint/products | public | Verified catalogue only |
| POST | /api/studio/estimate | customer/guest | Deterministic, validated server estimate |
| POST | /api/studio/saves | customer | Owner-only saved palette/plan |
| POST | /api/quotes | customer/contractor | Reuse existing quote contract, idempotency key |
| GET | /api/quotes/:id/offers | owner | Verified eligible dealer offers, expiry enforced |
| POST | /api/quotes/:id/accept | owner | Server-side price/GST/freight validation, transaction |
| GET | /api/orders/:id | owner/assigned dealer/partner/admin | Role-scoped tracking |
| POST | /api/studio/architect-leads | consented user | Rate limit, anti-spam, private contact |
- API responses use consistent `{data,error,requestId}`, typed validation, loading/empty/error states. No stub success for quote/order creation.

## Asset specification
- Initial **3 clearly labelled sample designs** to exercise pipeline, then 6 commercially cleared complete designs, then 24.
- Each published design: front, side, aerial, evening 2400px+ originals; WebP/AVIF responsive derivatives; interior views where claimed; stable camera/geometry correspondence; image-space mask polygons for main, accent, cladding, gate, railing, frames, boundary, roof.
- Store render source and commercial rights evidence, attribution where required, dimensions, checksum and revision. If any angle is missing, show “render not available”, not a copied generic house.
- Client recolour: canvas luminance-preserving blend, anti-aliased mask feather, undo/redo, day/evening, shade disclaimer; preserve original untouched. For customer photo, process locally by default, no upload without consent.
- 3D: geometry is explanatory only, dynamic import, DPR cap, 2D fallback, reduced-motion support; avoid autoplay heavy WebGL in hero.

## UX design tokens and components
- Mobile 360–430px first; spacing 8px grid, tap targets >=44px, body 16px, caption 13–14px, card heading 18–20px, H2 clamp(24px, 3vw, 32px), H1 clamp(32px, 5vw, 44px).
- Existing premium homepage components are source of truth. Keep exactly one prominent primary CTA per viewport; secondary tile actions remain links.
- Component additions: `PlotRequirements`, `FeasibilitySummary`, `PublishedDesignGallery`, `RenderGallery`, `MaskCanvas`, `PaintSystemEstimator`, `DesignComparison`, `StudioQuoteBridge`, `ArchitectLeadForm`, `AdminDesignPublisher`.
- Header location control should not block browsing; ask delivery pincode only when checking service availability. Hindi/English strings for all journeys and room labels.
- Mobile bottom safe area: `padding-bottom: calc(nav-height + env(safe-area-inset-bottom))`.

## Tests and release gates
1. Schema tests: draft never public; published requires approved assets and licence proof; unique slug/version; RBAC and audit.
2. Geometry: all rooms inside **buildable** polygon; no overlaps, opening voids and stairs headroom; parking feasibility; room area reconciliation; 6 plots × 4 styles and edge cases.
3. Recolour: pixel-mask boundaries, shadow/luminance retention, undo/redo, colour fallback, visual snapshots of licensed samples.
4. Estimator: openings subtraction, primer/putty/coats/wastage, pack rounding, GST/freight separation; never show unverified dealer price.
5. Commerce: quote idempotency, eligibility/pincode, offer expiry, transactional acceptance, role-scoped order, OTP replay/expiry, GST invoice reconciliation.
6. Browser: 360/390/430/768/1440, Hindi/English, focus/contrast, no clipping, zero uncaught console errors; 2D fallback without WebGL.
7. Lighthouse **measured** on production-equivalent preview: mobile >=90 performance, >=95 accessibility, SEO 100; LCP <2.5s and CLS <=0.1 are targets, not claims.
8. Release: CI green + staged deploy + smoke + manual visual evidence + rollback SHA. Never force production around an active safety gate.

## Phased build order and acceptance
A. Audit/contract (this document) -> city-rule and feasibility validator, migration, 3 sample assets clearly labelled, admin draft skeleton.
B. Approved image/mask pipeline -> real recolour, paint catalogue/estimator, shade disclaimer.
C. Gallery compare/save/share/PDF -> immutable BOQ -> existing RFQ/dealer/order backend (do not claim live until integration E2E).
D. 3D improvements, interiors, customer photo manual polygons, Hindi parity, SEO.
E. Six complete original licensed designs then scale to 24, verified dealer prices, offers, analytics.
Every phase: demo, shipped/stubbed/limits, passing test evidence and preview link. **No production merge on failed gates.**

## Role entry points (proposed; verify existing route/auth contracts)
Customer: /account, /design-studio. Contractor: /contractor (registration and verification). Dealer: /dealer (GST/shop/pincode application then admin approval). Delivery: /delivery (assigned orders only). Admin: /admin (super/design/catalog/support/finance). Until onboarding is connected, show honest “applications not yet open” rather than a fake successful signup.
