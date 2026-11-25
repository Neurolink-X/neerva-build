# GitHub Actions runner recovery

## Observed evidence — 2026-11-25 UTC
- PR 50 CI run 45522946942 completed successfully in 82 seconds with actual execution steps.
- PR 54 CI run 45529877634, PR 55 CI run 45530356206 and PR 56 CI run 45532380696 failed within 3 seconds.
- Raw GitHub jobs responses for PR 55 (138923835537) and PR 56 (138930604503) show runner_id: 0, empty runner name/group and steps: []. Log retrieval returns 404 BlobNotFound. These are pre-runner failures, not evidence that lint, unit or E2E tests executed.
- PR 55 originally had a separate confirmed npm ERESOLVE peer-dependency conflict. Compatible React 19.2 runtime and type pairs are restored and a lockfile compatibility check is in place. The next CI execution is still required.

## Recovery (repository owner)
1. Inspect the job annotation at https://github.com/Neurolink-X/neerva-build/actions/runs/45532380696/job/138930604503.
2. Check the repository owner's included compute usage, billing status and hard budgets: https://github.com/settings/billing/usage and https://github.com/settings/billing/budgets. Do not enable paid usage without explicit authorization. If the included usage is exhausted, use the next billing-cycle allowance or a properly isolated, owner-managed runner. Do not expose secrets to untrusted PR code.
3. Check https://www.githubstatus.com/ for an Actions incident. If no quota/policy issue is visible, contact GitHub Support with the above run and job IDs; the repository integration cannot inspect the owner billing account or check annotations.
4. Once the runner restriction is cleared, rerun the failed jobs once for each current PR head. Verify a nonzero assigned runner, real checkout/install steps and all required checks green. If a code failure remains, fix the specific error and rerun. Do not mark a runner-start failure as a passing test.

## Prevention
- Keep existing CI, mobile, authenticated E2E, security and catalog gates. Do not weaken test assertions or use continue-on-error to hide failure.
- Cancel superseded PR runs per workflow; keep manual strict audits independent. Group compatible dependencies, batch related commits, and avoid repeatedly rerunning a pre-runner failure.
- Owner should enable included-usage notifications and maintain a zero additional spend limit if required. Monitor compute and artifact storage before reaching the allowance.
- For an owner-managed runner, use a disposable/isolated Linux VM with Node 24, Docker, browser dependencies and no production credentials. Do not route arbitrary public PRs to a persistent privileged runner. GitHub Actions runner usage is free for self-hosted runners, but hardware and hosting are the owner's responsibility. Never migrate runner labels until an approved runner exists and the test environment is validated.

This document does not certify CI or authorize a release.
