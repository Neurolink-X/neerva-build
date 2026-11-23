# Neerva Build — PR24 pre-change audit (2026-11-23)

Scope: repository `Neurolink-X/neerva-build`, staged on PR23 head `0bfe8fad` (PR23 unmerged); read-only review of connected Neerva Supabase project `djgghisbkucprqiezrcn`; Vercel `neerva-build`. AuroWater is out of scope.

## Verified P0

1. **Production drift.** The public `neerva-build-neurolinkxs-projects.vercel.app` alias still points to the READY deployment for `585da084` (PR15). The subsequent main production attempt for `293ee4fb` failed in `scripts/release/recovery.test.ts` because inherited build credentials changed ignored-build-step expectations. PR23 preview `0bfe8fad` is READY, with CI and mobile regression green, **not** production. Merged PR20–22 are not thereby live. Do not claim live release.
2. **RFQ intake blocked on both sides.** `QuoteRequestForm` disables the submit button unless `NEXT_PUBLIC_RFQ_INTAKE_ENABLED=true`; `POST /api/rfqs` returns 503 unless `NEERVA_RFQ_INTAKE_ENABLED=true`. This was a deliberate operations/legal safety gate, not a database outage. Form requires verified sign-in, valid contact/consent and a backend RLS-owned insert; anonymous requests should not be silently saved.
3. **Unit mismatch.** Frontend always defaults to `truck`, including steel and cement. Backend `rfqSchema` allows only six of nine material categories; `paint`, `tiles`, `hardware` cannot pass validation. Product detail selector offers `length`, `coil`, `metre` despite RFQ schema rejecting them. Implement one shared category→unit contract and regression coverage; never change units on the server silently.
4. **Admin sourcing migration unapplied.** PR23 adds `0007_admin_sourcing_cases.sql`; connected DB lacks `admin_sourcing_cases` so new admin fulfilment route cannot work. Read-only counts: zero rows in `quote_requests`, `quote_invites`, `quote_offers`, `inventory`, `dealer_applications`. DB tables exist with RLS; no real stock, prices or dealer coverage can be advertised.
5. **Order fulfilment incomplete.** `/api/admin/orders` requires a configured/verified Spring order service; sourcing requests are *not* accepted orders. Do not invent order/stock/supplier records.

## Verified P1 and UX debt

6. **PWA discovery.** `InstallExperience` registers a service worker and listens for `beforeinstallprompt`, but banner is shown only after scrollY≥360 and browser eligibility; no explicit always-discoverable entry. iOS instructions also depend on scroll. Installability still depends on browser/platform and HTTPS; do not promise a native install prompt on unsupported browsers.
7. **Paint my photo.** `StudioPhotoPaint` uses a four-point manual wall polygon with a canvas; it is not automatic surface detection. Colour controls for both photo and concept are mixed; surface selection describes the concept elevation and is misleading during photo mode. Add a clearly numbered upload→mark four corners→choose colour→compare/export flow with visible feedback.
8. **Design claims.** The 24 legacy gallery entries span six plots × four style concepts, with draft approval state; rendered elevations share a geometry template. Separate `generateFacadeDrafts` currently creates 24 *composite* combinations from only two distinct base plan footprints and six facade kits × two massing types. Neither is 24 individually architect-approved, structurally unique nakshas. 3D is geometry-based but realism, local bylaws, city setbacks, correct façades and approved BOQs are not verified. Do not relabel decorative variants as unique floor plans.
9. **Home / FAQ / footer.** `PremiumHome` contains a prominent material search plus search recommendations/recents; two-search confusion and navigation need device review. FAQ is only three generic entries. Footer pages vary by route and lack clear install/help/contact expectations; no support/contact channel should be fabricated.
10. **Photos and prices.** Existing six local photos are category samples, not manufacturer SKU photos. Three categories have null photo assets. Public catalog is code-level reference profiles; inventory table has zero records, so verified in-stock labels, discounts and rates are unavailable. Do not hotlink/copy third-party copyrighted product imagery or claim supplier authorization.

## PR24 implementation and release order

A. Keep this audit committed before implementation.
B. Fix RFQ contract: share category units across selection and API, deterministic default and guards; test all nine categories, cross-category rejection, prefill and duplicate submission. Keep intake flags fail-closed until admin staffing/privacy/operational readiness is explicitly verified. Make the unavailable state clear, not a silent button.
C. Improve install discovery for supported Android/desktop/iOS, with accessible permanent entry, browser-specific instructions and correct appinstalled/dismiss state; avoid deceptive prompt claims.
D. Clarify own-photo paint workflow without uploading private photos; add guided corner feedback, reset, before/after and export; do not claim automated segmentation.
E. Reduce duplicated search/navigation confusion, expand truthful Q&A/footer navigation, improve product unit selectors and show verified vs unverified inventory status honestly.
F. Full design/3D reconstruction, 24 validated unique geometry models, brand-specific licensed imagery, dealer-stock sync, business contact intake and transactional orders require separate reviewed feature PR(s), architect/regulatory validation and integration tests.

## Production acceptance gates

- Final feature branch CI: release contract, lint, typecheck, unit/regression, Next build all green.
- Chromium 360/390/430/768/1440px, real mobile pointer interactions, no overflow or runtime console errors.
- Verified *real* customer session: request validation→`POST /api/rfqs`→RLS-owned `quote_requests` row→admin sourcing case→customer inbox; include malformed/duplicate/rate-limit/unauthorized negative tests. Never seed personal data into production.
- Apply `0007` safely after review and check trigger/RLS and real insertion with a test account in staging before activating either intake flag. Both flags must match. Confirm support channel, privacy policy and fallback operator.
- Confirm live Vercel alias points to the tested reviewed main SHA. Do not promote an unreviewed preview or bypass the release check. Do not claim real product stock/price/brand authorization without verified supplier records.

This document records a targeted static + live-configuration audit, **not** a completed end-to-end production acceptance test.
