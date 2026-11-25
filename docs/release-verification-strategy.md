# Release verification and quota control

The high-frequency catalog remediation branch opts out of automatic Vercel preview deployments; main and other branches remain at their existing default. GitHub CI and local mobile browser regression continue. This does not reset a provider quota already exhausted. Do not deploy until required checks and media acceptance pass.

Authenticated CI starts a disposable database without unrelated Studio UI, analytics and image proxy containers. Auth, PostgREST, database and storage remain enabled. Draft catalog SQL is executed twice and verified for row counts, idempotency, and absence of new inventory or prices. The generated SQL and summary are downloadable CI artifacts. No production credentials are used. Production import remains a separately reviewed action.
