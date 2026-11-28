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
