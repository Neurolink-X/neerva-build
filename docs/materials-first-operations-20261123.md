# Neerva Build — materials-first marketplace hardening report
**Date:** 2026-11-23. **Status:** Preview-only / no commercial launch approval.

## Release test incident permanently isolated
Previous Vercel production build failed in `scripts/release/recovery.test.ts`: test fixture unexpectedly inherited real production Supabase URL/key and expected the ignored-build-step to SKIP. With valid credentials, Vercel's build-step policy correctly returns 1 (BUILD). Regression tests now run subprocesses with standalone, nonsecret env objects and verify both `--check` (0 PASS) and ignored step (1 BUILD) semantics, including wrong project credentials (0 SKIP). The production contract remains fail-closed.

## Catalog and search
- Product discovery expanded from six to nine broad construction categories with practical brand, grade, size, packing and technical-details facets.
- Named references include known manufacturer product ranges. They are marked **reference examples**, not verified catalogue SKUs or supplier inventory.
- Existing locally hosted category photos include steel TMT bars, cement sacks, clay bricks, pipes, wiring and aggregate samples. The actual image pixel content for the TMT file was NOT independently confirmed against the original manufacturer product; UI labels it category sample only.
- Paint, flooring and hardware new category imagery is **pending** photo/license verification; no remotely hotlinked manufacturer or HomeRun photos are represented as owned.
- Product detail includes verification state, manufacturer reference when available, caveats on inventory and source, and no unsupported offers.

## Home and customer journey
- Primary focus: brands/materials and preparation of itemised material requests, Kanpur first; Design Studio remains secondary.
- 9-category grid uses existing local asset mapping and honest placeholder when exact imagery is missing.
- Native range slider is keyboard/touch accessible. Construction vs finished original concept drawings use animation with a single compositor clip-path and are paused offscreen/reduced-motion.
- Previous colour-mood static section replaced with a 3-stage illustrated construction progression, linking to materials and the colour studio.
- Quick quote drafts material category, name, quantity, pincode and city to `/quotes`, sanitized server-side. **This does not submit an RFQ**; customer contact is not collected while intake is OFF.

## Admin / dealer coverage fallback
- Admin-authenticated real `quote_requests` show `admin_sourcing_needed` when no dealer invites or offers exist. Dealer invited and offers received have separate states. RLS and platform admin guard remain in place.
- The nationwide sourcing queue means an admin can SEE real requests from any city. It is NOT a promise to supply everywhere.
- `GET /api/admin/orders` returns only actual persisted orders from configured Java Spring `/v1/orders/admin`, protected by platform admin JWT. Until `ORDER_SERVICE_URL` and the upstream order workflow are verified, the API returns a fail-closed unavailable status and shows no invented orders.
- Dedicated production database check at the time of the change: 0 real RFQs, 0 dealer invites, 0 offers, 0 approved merchant tenants. No seed/demo orders added.

## Launch blockers / release gates
- No actual verified supplier inventory, exact product photos, manufacturer authorization, selling offers, freight/unloading promises, coupons or delivery SLA.
- RFQ intake intentionally disabled until customer support, verified dealer/admin sourcing and legal documentation are operational.
- Payment/order acceptance, admin manual order assignment, supplier contacts and nationwide dispatch require a transactional backend, audit log, verified operator and real fulfilment partner agreements.
- A finished physical construction time-lapse would require licensed visual source media. Current original imagery is a concept comparison, not project footage.
- Maintain preview noindex; do not automatically promote an unreviewed deployment.
- CI lint/typecheck/tests/build/mobile E2E must be GREEN on final commit; verify actual Vercel preview commit and READY state before calling it live. Lighthouse and actual-device smoothness have not been measured.

## Inspiration, not copying
HomeRun's publicly visible material-category / SKU / quantity / location workflow informed search facets and material-first merchandising. No other site's proprietary content, images, branding, pricing or instant-delivery claims are copied.
