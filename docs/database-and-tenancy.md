# Database and tenant isolation

## Tenant model

- `tenants` represents a merchant storefront subscription, not the marketplace itself.
- `tenant_domains` maps a normalized hostname to exactly one tenant after ownership verification.
- `tenant_memberships` binds an authenticated user to a tenant and a narrowly scoped staff role.
- Shared marketplace products/brands are platform-owned; dealer-specific listings, inventory, prices, offers and orders carry merchant/tenant ownership.
- Resolve host → verified domain row → tenant ID on the server. Do not accept `tenant_id` from a browser request as authority.
- Include tenant ID in every relevant unique key, RLS predicate, storage path and private cache key.

## Initial migration entities

The first migration establishes the security-critical spine: profiles and platform roles, tenants/domains/memberships, categories/brands/products/variants, merchant branches, inventory, published price records/history, RFQs and private offers, audit records and an incident stub. Commerce, payment, subscriptions and design tables are added in later reviewed migrations with their own state and RLS rules.

| Concern | Constraints and indexes |
|---|---|
| identity | auth user FK; unique profile user; explicit role grants; no public profile enumeration |
| tenant | unique normalized host; verified timestamp; tenant status; membership unique `(tenant_id,user_id)` |
| catalog | stable slugs; unique SKU per product/merchant; typed attributes by category; only approved records public |
| inventory | unique `(branch_id,variant_id)`; nonnegative available stock; append-only movement events |
| pricing | integer paise; effective interval; published status; quantity floor; unique rule scope/version; append-only price history |
| quote | requester ownership; private merchant offers; unique idempotency key; expiry and revisions |
| audit | actor, action, object type/id, timestamp, safe metadata; append-only to app roles |

## Price privacy

`pricing_rules.visibility` is `public` or `quote_only`. Quote-only rows are excluded from public SQL views as well as TypeScript response schemas. Public API serializers explicitly construct allowlisted DTOs; they never spread database rows. RFQ dealer offers require requester/dealer/admin authorization and are not part of catalog queries.

## RLS approach

- Enable RLS on every table containing user, merchant, quote, order, payment, design or incident data.
- Anonymous users can read only published public catalog records and published public price records.
- Authenticated customers can read/update their own profile and addresses; they can read RFQs/orders only through requester ownership.
- Tenant members can access rows only when the row tenant matches an active membership and the permission for that action is granted.
- Dealers see only their merchant/branch inventory, their own offers and assigned orders.
- Platform-admin operations use server-side permission checks plus audited, narrowly scoped service-role access; no service key reaches the browser.
- Storage policies mirror row ownership and tenant scope. Public assets use explicit published paths only.

## Transactions and state machines

Order creation, inventory reservation and price snapshot creation must share one database transaction or a durable reservation workflow. Payment capture and webhooks are idempotent. Financial ledger rows are append-only; corrections are compensating entries. State transitions are enumerated and validated server-side. Confirmed price snapshots are immutable even after future admin updates.

## Retention and deletion

Define retention by record class before launch. Preserve legal/accounting records where required, minimize enquiry data, offer account export/deletion workflows, and avoid retaining raw uploaded BOQs/images longer than the declared purpose. Deletion jobs must respect financial and legal holds and write a safe audit event.
