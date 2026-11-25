# Catalog photography completion gate

Baseline: 376 variants / 264 grouped families (PR #65 audit). 170 families lacked configured photography before the latest additions. 144 public families lacked usable local visuals. These are distinct counts, not verified exact SKU coverage.

## Priority
P0: orderable, publicly discoverable and highly visited SKUs first; actual traffic and orders must be measured before assigning traffic rank. Within this tier: cement, steel, bricks, plumbing, electrical, tiles, hardware. P1: paint, aggregates and other public products. P2: direct-only accessories. Do not delete or hide product routes to improve counts.

## Per SKU completion checklist
- [ ] Record category, family, SKU, exact brand, grade, size, finish and pack.
- [ ] Confirm manufacturer or supplier product page and correct photograph.
- [ ] Confirm permission or documented reuse license and credit. No hotlink or unauthorized pack-art reproduction.
- [ ] If an actual image cannot be sourced, commission a clearly labelled generic illustration using verified material specifications, not counterfeit branded packaging; do not count it as a photograph.
- [ ] Review image identity and every view, reject inaccurate variants, visual duplicates, watermarks and misleading packaging.
- [ ] Optimize local WebP, preserve aspect ratio, checksum, dimensions, provenance; verify image decodes.
- [ ] Validate catalog card and detail page, variant switch, zoom, 360/390/430/768/1440 widths, no overflow, no broken images.
- [ ] Run full catalog audit, CI, mobile regression and applicable authenticated E2E. Never count skipped jobs as passed.
- [ ] Record reviewer decision and unresolved blockers.

## Evidence format
Category | SKU | family | public/orderable status | observed visits | priority | manufacturer URL | original image URL | license/permission | local asset path | SHA256 | width/height | asset kind (exact photo/family reference/illustration) | identity/visual review | status | blocker.

## Acceptance
Zero broken image URLs, zero unrelated images, zero unsupported exact-photo claims. Zero public missing visuals is a separate target from zero missing actual photos; both counts must be reported, including all hidden direct routes. Strict audit remains incomplete until its criteria are met. Use the machine-readable visualSourcingWorklist and exactSkuPhotography worklist from catalog-audit/report.json. No paid tooling or production writes required.
