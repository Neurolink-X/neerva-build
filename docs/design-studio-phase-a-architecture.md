# Neerva Build — Design Studio Phase A implementation blueprint

**Status:** work in isolated PR; production release NOT authorized.

## Audit of current source (23 Nov 2026)
- There are already 24 original plan JSON concepts: 15×30, 20×40, 25×40, 30×40, 30×50, 40×60 ft, each with four styles. The new brief mentions two additional dimensions, 18×50 and 20×45. Eight plot sizes × four styles is **32 designs**, not 24. Add the extra 8 only after real plan and asset reviews.
- Existing 3D viewer has actual wall openings, slab and RCC roof/parapet, but lacks approved original photorealistic images, matching interior renders, verified HDRI/material pipeline, and full 30+fps real-device evidence. Existing elevation and gallery are *concept SVGs*, NOT photorealistic assets.
- Existing geometry validation tests plot boundaries and overlaps. It does NOT verify local authority setbacks or practical room/parking usability.
- All four 15×30 plans contain a roughly 76 sq ft living/dining room, beneath a 100 sq ft **advisory planning reference**. Some 20×40 concepts have an 18×7.3 ft parking rectangle which fails a simple 8×16 ft clearance check; turning radius, gate and access also need expert review.
- Existing older Home Studio uses relative-position rectangles. Treat them only as conceptual; do not confuse with licensed architectural drawings. Main homepage hero currently enters the older studio instead of a plot-fitting flow.
- No dedicated **Neerva** Supabase project is connected. Existing connected project names are unrelated. Never apply Neerva migrations to another project's database.
- No authenticated quote → dealer offer → accepted order E2E is operationally verified. Do not represent draft prices or stub API responses as selling rates or completed orders.

## Architecture
1. Keep a **single** original 24-design JSON library as public read-only concept fallback. Reuse existing plan / geometry / 3D / colour / gallery modules, not copies.
2. Plot-fit engine: compare dimensions, facing, road access, requested bedrooms, levels, room minima and parking dimensions; provide grounded reasons and score. Scores rank *concept options*, not legal compliance.
3. Municipal rules: versioned city profiles with authority/source citation, effective dates, setback envelope, FAR and minimum areas, only after review. Unverified rules never enter approval status. A concept always requires a licensed architect/engineer and local authority permission.
4. Media: authenticated admin review of original/licensed multi-angle assets, each with SHA-256 and licence evidence. Surface mask JSON is versioned with image dimensions/texture origin; never accept a simple SVG facade as shipped photorealism.
5. Customer: anonymous browsing may use local storage; account favourites and saved drafts require user-owned rows and explicit consent. No PII in Git.
6. Commerce: derive BOQ from validated plan and admin-reviewed thumb rules; send itemised RFQs to eligible approved dealers by pincode. Offers must show GST, freight, unloading, validity. Order transitions and OTP require transactional backend and row-level authorization.

## Schema / migrations (proposed; not applied)
- studio_city_rules: authority/source, versioned setbacks/room thresholds/FAR, verification status and reviewer.
- studio_design_records: versioned design JSON, lifecycle draft → review → published, reviewer, source provenance and computed area checks.
- studio_design_assets: original/licensed media records, source path/checksum, angle, dimensions, altitude/alt text, revisioned masks, approval.
- studio_user_favourites: signed-in ownership; private by default.
- studio_design_audit: append-only audit of edits and publishing.

All new exposed tables must enable PostgreSQL RLS; publishing privileges limited to approved admins. No project configuration, service role keys, secrets or personal files in Git.

## API list
- /design-studio/fit — public guided brief and concept ranking (Phase A new).
- /design-studio/library and /design-studio/library/[slug] — existing gallery/detail, preserve.
- /design-studio/visualizer and /design-studio/workbench — existing colour/editor routes, preserve.
- GET /api/studio/city-rules?city=... — only verified city rules (after dedicated DB).
- GET /api/studio/designs — published versions and approved assets (after dedicated DB).
- POST/PATCH /api/admin/studio/designs and /assets — JWT, admin review and audit (after dedicated DB).
- POST /api/quotes/from-design — validated BOQ, user consent and request idempotency (after authenticated commerce).
- POST /api/quotes/accept-offer — atomic expiry/price/tenant recheck before order (after backend).

No fake write success while service is unavailable; return a meaningful error state.

## Original asset specification
For each of six fully finished launch designs: 3–4 matched exterior images (front, side, aerial, evening), source long-edge 2400px+, responsive AVIF/WebP, license evidence and coherent plan geometry. Interior photographs/renders by room and dimensions, with **Sample interior** label if generic. Versioned surface masks: main, accent, cladding, windows, railing, gate, boundary, roof/parapet; room walls, ceilings, floors, cabinets. Luminance-preserving recolour, manual polygon correction, undo/redo, accessible before/after, mobile fallback. Assets without verified rights remain draft. Use **Plan illustration — photoreal render pending** until approved media is actually present; do not invent testimonials, cost, material stock or sample quality.

## Test plan and release gates
1. Plot/room bounds, overlap and area consistency; property tests for foot, metre, gaj conversion; impossible plans fail closed.
2. Verified setbacks and city rule state; no unverified authority codes.
3. Parking clearance & circulation warning; doorstep, headroom, windows and gate review markers.
4. Paint net surface = wall perimeter × height − openings, with separate coatings, coverage, primer and wastage.
5. Media licence and SHA-256, mask clipping bounds, colour/shadow visual regression.
6. Owner-only favs, admin-only publishing, dealer-only RFQs; signed-in E2E request to accepted order and delivery OTP.
7. Chromium mobile 360, 390, 430px plus 768/1440; no overflow, console errors or clipped navigation.
8. Lighthouse lab measurements and real midrange-Android test before claiming Performance 90+, Accessibility 95+, SEO 100 or LCP ≤2.5 s.

## Build order and honest delivery
A1. Existing design data audit, constraint/fit engine + unit tests.
A2. Mobile plot-first gallery entry, clear reasons and navigation to current detail/colour route.
A3. Versioned city/profile/admin and media schema, secure review; only when dedicated database exists.
A4. Six original fully rendered designs, initially three explicitly labelled samples if licensed images become available.
B. Image/mask/recolour/paint BOM with tests.
C. Compare, saved concept, brochure, BOQ to real RFQ/offers/orders.
D. Full geometrical 3D, interiors, photo repaint, complete Hindi, accessibility.
E. Scale to 32 designs if eight sizes are required, approved asset catalog, analytics, offers, SEO.

**This PR delivers A1/A2 only until schema and media work are proven.** Production is guarded. The old live site stays unchanged until verified new release.
