# PR25 preliminary design and commerce audit — 2026-11-23

Base: PR24 clean tree `40e4598` (requires PR24 merge before this PR can enter main). No launch flags changed.

## Verified geometry and UX defects
- Legacy 24-design gallery `DesignPlanArt` draws `ROAD` at the lower edge after the plot depth; modern `PlanModel`, gate and pedestrian entry use local Y=0 as **front/road edge**; the visual directions are inconsistent. The old gallery's geometry cannot inherit a verified road-facing gate merely by moving the label. The generator's road-plan diagrams already consistently transform compass orientations with `roadPoint/roadRect`.
- Legacy gallery contains 24 static inspiration layouts **across six plots**, not 24 layouts per arbitrary user plot; some same-mass facades and static visual photos repeat. `generateFacadeDrafts` creates 24 composite facade/massing variants from 2 plan footprints; these are not 24 independent architect-designed plans.
- Road-first generator `generateRoadPlans` validates just two mirrored car-parking layouts and refuses other plots if minimum usable width 17.5ft or depth 47ft, including nonparking (currently blocked). It already updates 2D/3D same PlanModel for supported plot sizes; no automatic stretching of a static plan allowed.
- Static legacy gallery card hero uses 4 rotating concept images for 24 plots unrelated to exact geometry; misleading for exact render. Distinguish each floor plan and linked plan-matched 3D; never pretend a stock exterior image is an architectural render.
- Materials use nonverified category sample photos; public catalog has no SKU photo proof, dealer inventory or price rows. Brand names/manufacturer references are visible, but exact branded product photography requires a verified/licensed asset pipeline. Avoid image reuse to falsely imply exact variants and never fabricate manufacturer authorisation.
- `ProductDetailTools` uses 4 illustration slots even without true angle photos; call alternates *illustrations* and make one obvious primary product photo only if verified.
- `/basket` and `/material-list` are separate planning flows. There is an unused Print list action and quote prefill `material` truncates at 240 characters. Avoid pretending this is a submitted order.
- Header uses a search icon link to `/materials` rather than focus/search; material-search has one actual input in hero. Make search access direct, keyboard-accessible, consolidated. Different page families render different footer structures, and wide columns can overflow narrow devices.
- PWA banner shows globally in bottom part of viewport, but explicit header install access might be clearer; exact browser prompting depends on `beforeinstallprompt`.

## Next PR priorities
1. Align road-side plans and parking in gallery with upfront entry-side explanation, link to consistent parametric road-plan tool; add focused regression tests that no unsupported road side is silently assumed.
2. Improve mobile footer/header access, material search, and quote CTA while retaining fail-closed backend gates.
3. Improve truthful brand/spec/product media identity, avoid repeated artificial angles, use a licensed exact SKU image only after image proof; test no fake stock/availability.
4. Make plot-size changes actually re-evaluate geometry and matched 3D only on supported plans, and communicate blockers for unsupported combinations. Do not claim all 24 legacy designs are independently regenerated or professionally validated.
5. Deliver truly 24 **different, validated floor-plan topologies for each plot configuration** only after staged geometry work, architect reviews, local setbacks, conservation of room areas, privacy/legal approval, E2E and performance evidence. 24 decorative facade combinations do not meet acceptance.
6. Photo-real construction asset must show *same site and building* at construction and completed stages, licensed/owned and locally optimised; current illustrations are not a real time-lapse.

## Release conditions
- Test across 360/390/430/768/1440px for overflow, touch controls, hero, photos, gallery and responsive footer; assert no 404 or image fallback pretending to be exact SKU.
- Generated floor plans: no overlaps, valid road and gate placement, parking minimum 8x16 ft on the road edge, exit access, minimum rooms, stair connectivity, same 2D/3D geometry across plot mutations. Unverified plans remain DRAFT.
- All GitHub CI and mobile checks green on final SHA and a Vercel preview READY before merge; no production release without actual release and alias verification.
