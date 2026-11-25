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

## Executable follow-up
- `scripts/ops/plan-fk-indexes.sql` outputs deduplicated concurrent index candidates from current schema; execute only reviewed statements after staging evidence, outside a transaction. Re-run advisors and verify query plans.
- `scripts/ops/migrate-primary-domain.mjs` now requires exact approved production SHA and backup confirmation and attempts rollback of all domains moved in that invocation if cutover verification fails. It is not a substitute for DNS and auth redirect review.
- `scripts/e2e/marketplace-reliability.mjs` uses disposable local identities and synthetic UTR claims; never verifies a real bank payment.
- `scripts/ops/disposable-recovery-drill.mjs` validates backup/restore of a draft-catalog snapshot in an isolated schema. It does not establish production disaster recovery.
- Public health checks run twice weekly with bounded GET requests and fail on errors or latency-budget breaches; native GitHub workflow failure notifications depend on user settings and available runner quota.

- Production catalog preflight checks the exact tested export SHA-256, checkout commit, isolated production host, backup and maintenance confirmation. It only permits a fresh initial draft import; existing catalog reconciliation is intentionally a separate operation.
- Mobile browser evidence includes initial-load TTFB, load time, LCP and CLS observations at 390px; no synthetic result is represented as field INP or verified mobile speed.
- Approved public branch identities are not private data; dealer E2E checks private memberships, private stock and unauthorized writes separately. Admin global inventory is reported unknown rather than a misleading zero until a reviewed aggregate permission exists.
