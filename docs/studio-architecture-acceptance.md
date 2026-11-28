# Studio release acceptance plan

This is an implementation checklist, not a certificate of design quality or statutory compliance.

| Area | Required evidence | Status |
|---|---|---|
| Colour Studio | 72 curated designs, 24 replacement designs, unique motifs, bounded workload, original-photo masking, preview/save consistency | Implemented in PR; browser and visual review pending |
| Residential | Exact bedroom count, plot, setbacks, road, floors, car access, reciprocal doors, ventilation checks, aligned shafts | Existing validator retained; regression tests expanded |
| Distinctness | Exact 2D geometry and 3D mesh uniqueness; room topology representatives and front composition counted separately; no cosmetic padding | Implemented; coverage evidence pending |
| Front staircase | Actual adjacent parking/stair geometry and aligned floors; filter exposes validated candidates | Implemented; footprint and professional stair review remain separate |
| Front elevation | Real openings and balcony geometry; no fake facade windows | Existing renderer retained; composition-aware ranking added |
| Commercial | Exact programme, access adjacency, two core reserves, parking count, unique visible interiors, separate topology counts | Implemented ranking and coverage; detailed expansion still pending |
| Performance | No external artwork assets; bounded motif counts, cached architectural profiles, no additional 3D instances | Verification pending |
| Production | Build, lint, unit tests, authenticated isolated E2E, mobile browser regression, preview review | Pending |

24 geometry-checked variants are a target, not a guarantee of 24 independent architecture families. Show the actual meaningful programme count. Never silently change an input or duplicate a plan to fill the gallery. A mirrored plan can be useful for site access but is not a new architecture family. No code compliance, photorealism, or structural certification is implied. Review actual artwork at 360, 768 and 1440 px and on a low-end device before claiming premium visual quality.

## Follow-up implementation
- Added compact private-bedroom / side-passage candidates, additional commercial service-room programmes, six bespoke mural compositions, a 16-entry derived artwork cache and plan-aware commercial frontage rhythm.
- Legacy commercial snapshot reconstruction and UI restore use exact saved identities.
- Remaining release evidence: latest CI and authenticated E2E, mobile/browser screenshot inspection, user-perceived artwork quality, full-platform field metrics and load testing. These changes are not proof of ultra-photorealism or universal 24-family coverage.

## Verification expansion
- Browser gate exercises all 72 actual full-wall canvas renders, hashes each image and records nine representative screenshots; distinctness is a mechanical check, not aesthetic approval.
- Responsive entrance filters now share the same frontage-composition grouping as the count, and shortlist selection resets incompatible filters.
- Isolated capacity rehearsal covers twelve public/API routes at 5/15/30 workers; per-route latency and failures are included. Sequential read benchmark covers additional Studio and knowledge pages. Neither simulates signed-in production traffic or measures real-user field INP.

- Browser artwork checks moved to a dedicated regression module; existing reviewed source-size budget unchanged.

## All-input coverage expansion
- Wide/high-BHK plans now include a second actual circulation architecture: vertically aligned street-side stair, independent pedestrian entrance and rear bedroom allocation, passed through the same validators and geometry/mesh deduplication. Earlier wide plan identities remain available through the legacy resolver.
- Added a 72-brief deterministic input matrix across 18 scenarios and all four road directions, including custom dimensions, 1–6 BHK, 1–3 levels, parking on/off, setbacks and L-plot orientations. It records validated counts, programme groups, facade groups and feasible/blocked cases. This is representative coverage, not proof for every continuous dimension or municipal compliance.

## Strict geometry and site screening follow-up
- Enforce modeled bathroom area (20 sq ft), bathroom/corridor widths (3 ft), finite gate/opening values, strict one-stair-per-level sequence and straight car-bay/gate alignment. Commercial parking, toilet and corridor reserves also checked. These are advisory concept geometry constraints, not finished clear widths or statutory standards.
- Compact street-service alternative, new pedestrian court architecture and wider street-bedroom allocation; all candidates pass common geometry checks and preserve legacy IDs where previously feasible.
- Review on-site ventilation exposure and bathroom exhaust explicitly; do not claim compliance or vehicle swept-path without road width, vehicle dimensions, neighboring buildings and survey inputs.
- Commercial interior lighting and actual-aperture glazing frames improve rendered detail. Photorealistic visual acceptance remains subject to browser screenshot review.

## Regression corrections
- Preserve every prior compact footprint in the full gallery and append new geometry within the existing 24-option maximum, instead of replacing older choices. Tests assert preserved IDs and signatures and increased counts.
- Recognize a street-facing bedroom separated from a car bay by an independent entry verandah, so both front-bedroom and stair alternatives are prioritized without implying direct adjacency.

## Micro-home expansion (35–100 gaj)
- Added deterministic narrow-home service-first / living-first plans, parallel and serial wet cores, multi-level stair reserves and a separate compact parking duplex family. Gaj is area only; actual frontage, depth, setbacks, floors and parking remain authoritative. Shared PlanModel and exact geometry/mesh deduplication are mandatory.
- New 40-case matrix exercises 35, 40, 50, 60, 80 and 100 gaj examples, alternate proportions, G+1 and compact parking; impossible inputs remain explicit. Nominal modeled room minima are not reduced. Wall-finish clearance, ventilation, stair flights and turning remain site-specific review items.
