# Audit-based release readiness (2026-11-25)
Read-only baseline: main efaba738; production was a different commit. Production catalog/products/variants, inventory, dealers, prices and orders were empty. Domain mapping was on the legacy project. Database advisors reported 5 privileged-function warnings, leaked password protection disabled, 53 unindexed FKs, 12 RLS initplan findings, 12 multiple permissive policy findings and 31 unused indexes. These are evidence, not confirmed exploitable vulnerabilities.
 
## Implemented
Admin-only on-demand marketplace readiness counts with explicit unknown/empty/present distinction. No automatic polling, secrets, DML, or public exposure. Existing incidents panel is unchanged.

## Required release gates
- Run all CI and authenticated disposable tests; do not merge failed or unexecuted checks. Verify source SHA against target production deployment.
- Export reference catalog as drafts, import twice in disposable DB, compare counts and review exact SKU rights before production import. Do not invent prices or stock.
- Review index candidates against query plans and workload, stage additive indexes only; never delete unused indexes on a new empty marketplace merely to clear an advisor.
- Review privileged functions and RLS using distinct customer/dealer/admin fixtures. Do not revoke intentionally used RPCs blindly. Enable compromised-password protection if supported by current plan; otherwise document compensating controls.
- Verify domain migration preconditions, existing assignments, TLS, auth redirects, rollback and canonical origin before executing existing migration script.
- Real authenticated order, inventory, payment/refund and dealer isolation tests plus low-memory mobile Studio tests are required. No real payment or dispatch from tests.
- Free-tier quota monitoring and restore drills remain necessary. No new paid tool is introduced.
