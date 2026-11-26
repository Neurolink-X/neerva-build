# Customer account hub release gate

- Existing authentication, password recovery, dealer/admin role checks, checkout return and sign-out retained.
- Customer shortcuts link to existing routes. Wishlist and project planner retain device-local semantics; no fabricated cloud synchronization. Colour previews remain downloads, inspiration boards retain existing storage.
- Address book uses user-owned Postgres rows, not browser storage or JWT user metadata. Writes explicitly bind owner, database RLS enforces owner and rejects reassignment. Checkout copies fields only after explicit selection, clears chosen address if session owner changes, and retains existing server-side order validation.
- Address schema is staged at docs/sql/customer-saved-addresses.sql. Supabase CLI was not available in this environment. Generate a tracked migration in the repository using the project's CLI, apply it in an isolated staging environment, then verify select/insert/update/delete against two distinct authenticated accounts and anon. No migration was applied to production.
- Before release: test profile update, logout, password recovery, safe checkout return, each account link; verify 360/390/768/1440px, keyboard focus, long profile names, blocked/expired session, cross-account address access, address CRUD, and manually entered checkout when address service is unavailable.
- Referral rewards, notification centre, saved payment methods and cross-device saved plans are not represented as active; require separate operational implementation.
