# Neerva cloud CI compute policy

Keep the repository private, standard GitHub-hosted Linux runners, Node 24 and zero intentional paid usage. No self-hosted runner is introduced.

## Operating model
- Keep active development PRs as drafts and batch related commits. The six PR workflows defer runner allocation while draft. Opening a ready PR, reopening, synchronizing a ready PR and marking ready trigger applicable checks; converting back to draft cancels superseded work using existing concurrency groups. Manual dispatch remains available where configured. Draft PRs cannot merge; never convert to ready solely to bypass gates.
- Full lint, typecheck, dependency audit, release verification, unit/contract tests, production build, applicable authenticated isolated DB E2E, browser regression and catalog integrity checks remain. No test command removed. External media review still uses existing path filters; manual candidate staging added.
- Reuse npm and Chromium caches and restore Next incremental cache only (never a completed build). Main push CI alone writes the Next cache after a successful build; PR jobs and browser jobs restore only. Do not cache the isolated authenticated environment, credentials, or production user data. Cache hits are optional; a fresh build remains required.
- Evidence retention is 7 days for main CI, mobile and authenticated reports; review artifacts remain available under existing policies. Copy evidence needed for long-term audits before expiration.
- Never use a previous SHA's green checks as current release evidence. Before merge, verify the current ready PR head, every applicable workflow and Vercel deployment. Strict catalog review remains manually available. Repository branch protection could not be read by the integration; verify required check configuration independently. No repository settings changed.

## Cost controls
- Included usage is shared across private repositories in the account. Enable usage notifications and verify zero additional spend budget with stop-usage enabled where available. Review usage weekly. Do not add a payment method or increase a paid budget without owner approval.
- Forecast with actual runner minutes from GitHub usage reports, not elapsed wall time of parallel jobs. Target at most 80% of confirmed included allowance, reserving the remaining 20% for release/security checks. No fixed savings percentage is claimed until measured.
- Prefer fewer well-reviewed PR updates rather than retries during a billing block. The current billing annotation confirms payment/spending-limit restriction; these code changes do not lift it. Do not use repository visibility toggles to avoid billing. Ubuntu slim is not selected because Docker, browsers and build memory requirements must be validated first.
