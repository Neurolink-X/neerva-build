# Neerva long-term engineering policy

Horizon: 2046. This is a maintenance policy, not a guarantee of uptime or future code compliance.

- Identity: deny by default, enforce database RLS and current account status on every protected operation. Never bypass authorization during outages.
- Data: additive migrations, versioned contracts, tested restore and export, explicit retention and deletion. Never use production data in disposable tests.
- Reliability: bounded retries only for idempotent operations; preserve request keys; distinguish unknown outcomes from failed writes. Maintain manual recovery and rollback procedures.
- Construction education: distinguish stable principles from current regulations and emerging techniques. Record source, jurisdiction, edition and review date for technical guidance. Require professional review before publishing safety-critical advice. Review annually and on regulatory change.
- Release: exact-head lint, typecheck, unit, route contract, build, mobile and authenticated isolation tests; review findings resolved before merge. Monitor production separately; no claim of live success until verified.
- Longevity: prefer open formats, documented interfaces, replaceable dependencies, accessible progressive enhancement, and local fallback for non-sensitive learning tools. Review dependency support and security advisories regularly.
- Recovery: rehearse restore and rollback quarterly in an isolated environment; record results and corrective actions. Never automatically apply unreviewed production code or database changes.

These are required operating practices; this document does not itself schedule or execute reviews, backups or monitoring.
