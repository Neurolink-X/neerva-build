# Product requirements — NEERVA BUILD

## Product outcome

Help Indian homeowners, contractors and builders discover construction materials, compare verified specifications, obtain accurate dealer pricing or a private quotation, and manage purchases. Use design tools and dealer storefront SaaS to improve conversion and recurring revenue.

## Initial market

Launch operations begin in Kanpur. Noida is the next focus. The platform must accept other cities as configurable markets; city selection must not be hard-coded as a booking blocker. No city is represented as covered until at least one approved merchant and a valid delivery zone exist.

## Users and permissions

| Actor | Core capabilities | Boundary |
|---|---|---|
| Visitor | Browse catalog, use public calculators, request a quote | No private account data or dealer offers |
| Customer | Addresses, shopping lists, carts, orders, quotes, saved designs | Own records only |
| Contractor / builder | Multiple sites, bulk RFQs, budgets, team members | Project-scoped member access |
| Dealer / merchant | Catalog, inventory, pricing, orders, RFQs, deliveries | Own merchant and branch records only |
| Dealer staff | Assigned sales, stock, dispatch or accounts work | Explicit scoped permission; no tenant or payout administration by default |
| Design professional | Verified design listings and consultation work | Approved credential state and assigned requests |
| Support / finance / admin | Separate operational permissions | Least privilege, audited sensitive actions |

Authorization is enforced in server code and PostgreSQL RLS. Hiding a control in the browser is not authorization.

## Phase 1 acceptance criteria

1. A visitor can search the category catalog and use area conversions in square feet, square metres and square gaj.
2. Product specifications are category-specific; the system does not invent a brand/grade combination or live price.
3. Quote-only sand, morang and configured bulk categories return no public price field from the API.
4. An RFQ includes items, quantity/unit, delivery city and pincode, requested date, and private contact channel; the request is validated and spam-limited before persistence.
5. Dealer responses are private to their authorized dealer, the requester and approved platform roles; competing dealers cannot read them.
6. Cart prices are recalculated on the server. Accepted orders retain a price/tax/freight snapshot that later catalog updates cannot mutate.
7. Dealer and customer data is tenant/user scoped at server and database layers.
8. The app is keyboard usable, mobile responsive, server-rendered for public pages, and private routes are excluded from indexing.
9. No fake reviews, verification badges, live inventory, delivery promise or fabricated market price is shown.
10. Production claims require test evidence; failed CI blocks merge/release.

## Phase 1 non-goals

Real payments/capture, a completed dealer operations dashboard, broad city coverage, construction-ready architectural plans, automatic wall segmentation, full 2D editing, 3D modeling, subscription billing and white-label domain automation are not claimed by the foundation milestone. They require separate integrations, qualified review, and end-to-end tests.

## Core journeys

### Public discovery

Open home → search/filter materials → select city/pincode → view category-appropriate details → see a live published price or an explicit quotation flow.

### Bulk RFQ

Choose material/variant → specify quantity and unit → give project delivery location/date → pass spam checks → receive a private RFQ reference → eligible dealers respond privately → customer reviews line-item price, tax, freight, unloading, availability and ETA → accept terms → create an immutable order snapshot.

### Purchase

Discover → select/configure → compare → cart/RFQ → address → server-side final price → price-change acceptance if changed → payment or supported offline confirmation → split fulfilment by merchant → delivery proof → invoice → review.

### Design discovery

Choose plot dimensions/units → separate actual plot area from permissible build area → compare genuinely different curated same-size plans → save a version → request professional review. Plans remain conceptual until checked by an appropriately qualified professional and local authority.

## Product truth policy

Demo data is labelled. Live prices, stock, dealer verification, delivery capacity, certification, legal status and design credentials must have a current source record and audit trail. Unknown means “not yet verified,” not a positive claim.
