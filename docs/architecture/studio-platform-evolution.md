# Neerva spatial platform evolution

## Implemented boundary
Residential PlanModel and commercial BuildingConcept stay authoritative for their respective generators. The versioned neerva.spatial-concept v1 exchange is an adapter, not another geometry generator. All views and preliminary quantities must derive from the selected model. The SHA-256 digest is for geometry identity, not authorization or an approval signature. The JSON is not an IFC file.

## Next production architecture
- Persist immutable model revisions behind owner-scoped authorization. Bind engineering decisions, render artifacts, material schedules and quotes to a specific revision; never rewrite a purchased project's quantities retrospectively.
- Add occupancy-specific detailed room/door/window/shaft objects to commercial models, with stable IDs and explicit site coordinate transformations. Separate site, storeys, spaces, physical elements and engineering systems.
- Introduce independent versioned validators and authority rule packs. Require source URL, clause, jurisdiction, effective date, verified applicability and reviewer. Missing or obsolete data must return unknown, not compliant.
- Add IFC4.3 exchange through a schema-validated adapter (IfcProject/Site/Building/BuildingStorey/Space and supported physical elements), stable GUID mapping, explicit units, round-trip tests and independent buildingSMART validation. Do not label custom JSON IFC.
- Maintain architectural, structural and MEP models separately, coordinated by references and clash reports. Fire/life safety and accessibility require actual geometry and licensed review.
- Derive verified BOQ from approved physical elements and specification revisions. Map to canonical catalogue SKU and unit, separately validate pack conversion, allowance, supplier coverage, current price, tax, stock and freight. Quote only after customer review. Never auto-purchase.
- Keep heavy IFC processing and high-quality rendering out of synchronous request paths; use bounded asynchronous jobs with cancellation, versioned inputs and cache keys. Use existing local rendering for concept previews.
- Build regression matrix across occupancy, sizes, floors, orientation, invalid inputs, selected option, stale artifacts, permissions, RFQ idempotency and mobile usability.

## Required release gate
Typecheck, lint, unit tests, mobile browser regression, authenticated isolation, build and preview verification. Qualified engineer review and current jurisdictional rules are mandatory for any feature claiming engineering or construction approval. No production migration is implied by this document.

References: https://technical.buildingsmart.org/standards/ifc/ and https://www.bis.gov.in/standards/national-building-code/?lang=en and https://www.awasbandhu.in/en/pages/order-list
