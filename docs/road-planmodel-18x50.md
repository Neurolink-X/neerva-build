# Road-first PlanModel — 18 × 50 ft (100 gaj) phase 1

## What the supplied prototype contributed
- **Adopted:** chronological road-to-rear zones, hard minimums and scoring, adjacency detection, deterministic candidate diversity, decomposed walls with real openings, non-destructive brightness-preserving recolouring.
- **Rejected:** Math.random comparator (sort instability), width allocation by target area without guaranteed dimensions, arithmetic `touches()` as proof of walkable doors, unchecked 3D opening overlaps, in-place photo recolour and any unverified city setback as law.
- **Kept separate for now:** legacy 24-design gallery, existing planner and general plot-fit screen. New road-planner is an isolated audited phase 1, preventing regressions.

## PlanModel v1
Source: `src/modules/studio/plan-model.ts`.
All lengths in feet; `x=0..frontage`, **`y=0` along the road**. `roadSide` labels N/E/S/W. Full geographic north rotation and adjoining road widths still require a surveyed plot.
- Version and ID, plot frontage/depth and road side.
- Unverified setbacks (front/rear/left/right) which decrease usable area.
- Configurable 9-inch outer and 4.5-inch inner walls (geometry is still simplified in bridged Three.js).
- Rooms with type, ID, floor, rectangle, minimum width.
- Door/window openings with explicit connecting room, sill, height and width. Connection edges require paired actual openings.
- Car gate, 8 × 16 ft minimum advisory bay, verandah, stair shaft aligned across G+1, balcony and facade theme.
- Advisory score, concept-only flag, never a claim of regulation or construction approval.

## Road-to-rear generator
Source: `src/modules/studio/road-generator.ts`.
The conservative benchmark is usable frontage ≥17.5 ft and depth ≥47 ft for parking + tested circulation (18×50 with entered zero setbacks is the test case). Layout sequence:
1. Car gate and bay on road edge; separate pedestrian verandah and living/drawing.
2. Rear of living joins dining via actual 2.5+ ft door.
3. Staircase directly adjacent to dining, same footprint on the next level.
4. Side-ventilated kitchen, neighbouring bath and an access passage.
5. Rear transverse hall to private bedroom and utility/wash.
6. G+1 adds a true street balcony, upper bedrooms and landing.

Two distinct mirrored alternatives pass; a fake third is NOT produced. This is not a full residential constraint solver. Important missing verification: local setbacks/FAR, stair tread/rise/headroom, structural safety, fire rules, car turning and bathroom exhaust.

No parking / 2BHK-G narrow single-floor / 15×30 3BHK+parking requests are deliberately rejected until a sound alternative family passes.

## Geometry and visual consistency
- SVG floor plan draws every actual room dimension, paired door and window at PlanModel coordinates and always places ROAD at local y=0.
- The existing Three.js building renderer receives a **derived** `StudioDesign` adapter. Geometry, door/window positions and floor selection originate in PlanModel; its current wall thickness/stairs are simplified.
- Elevation is a **conceptual roadside illustration** with gate placement derived from PlanModel. It is not yet a unique parametric facade kit or verified architectural rendering.
- Area and paint estimate derive from the same rooms/openings; measured as *room-facing surfaces*, not a structural material BOQ. Shared walls count both faces; no fake cement/steel quantities or selling prices.
- Mask recolor utility preserves source pixels, feathering and luminance hierarchy, but is NOT yet used to replace the photo editor.

## Automated negative/positive QA
`src/modules/studio/plan-model.test.ts`:
- G and G+1 18×50: road-facing parking/verandah, 16 ft car-bay depth, named rooms, doors/stair connections and valid area.
- N/E/S/W road sides: coordinate front is always the road side.
- Reject 15×30 3BHK with parking and 18×50 ground-only 2BHK with parking.
- No room overlap, all rooms inside site envelope, real connectivity for each habitable room, window to external wall.
- No invalid or overlapping openings; physical wallBoxes preserve lintels.
- No cumulative image recolour; masked and unmasked pixels remain correct.
- Candidate hashes are distinct and deterministic.

Mobile regression adds 18×50 page screenshots and impossible-program screenshot at 390px; other viewports 360/430/768/1440 visit the route.

## Next phases before any architectural/commercial claim
1. A verified local civil architect specifies feasible circulation widths, FAR/setbacks and stair rules for Kanpur/Ranchi and signs off a real model.
2. Generate a third **topologically different** variant, e.g. courtyard or rear stair, only when a validated feasible candidate exists.
3. Convert all 24 library designs to PlanModel; generate 24 distinct plan+facade hashes and consistent elevations. Existing samples currently contain only 16 unique room layouts and one massing family.
4. Upgrade geometry to true external/internal wall thickness, slabs, stair construction and daylight/orientation transforms; inspect WebGL/mobile memory.
5. Full room/BOQ/paint pipeline and verified dealer quote itemization. Current RFQ intake is intentionally OFF.
6. Lighthouse, accessibility, actual screenshots and legal/engineering reviews; do not overstate.

**Release rule:** This PR must pass lint, TypeScript, unit suite, build, mobile E2E and source-preservation contract; otherwise leave it unmerged.
