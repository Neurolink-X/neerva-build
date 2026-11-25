# React dependency compatibility policy

React and React DOM are deliberately kept at the exact stable 19.2.0 release, with matching 19.2.x declaration packages. The original partial 19.3.x upgrade produced ERESOLVE. Upgrade as a group only with a registry-resolved lockfile, not hand-edited dependency versions, --force or --legacy-peer-deps.

Before installation, CI checks exact pins, root lock alignment, resolved versions, nested incompatible copies and runtime/declaration major-minor alignment. After npm ci, npm ls validates the installed peer graph. Seven positive/negative fixtures protect these rules without a separate runner. Existing lint, typecheck, contracts, tests and build remain required.

For a future upgrade, review official framework support, dependency advisories and migration notes; regenerate the lockfile using the supported Node version; run the guard, npm ci, installed graph checks, full release CI and current mobile E2E. Do not interpret compatibility checks as a vulnerability assessment. Review full npm audit output, including development dependencies, separately from the mandatory production audit. The current billing restriction prevents full CI confirmation.
