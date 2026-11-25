# React dependency compatibility policy

React and React DOM are deliberately kept at the exact stable 19.2.0 release, with matching 19.2.x declaration packages. The original partial 19.3.x upgrade produced ERESOLVE. Upgrade as a group only with a registry-resolved lockfile, not hand-edited dependency versions, --force or --legacy-peer-deps.

Before installation, CI checks exact pins, root lock alignment, resolved versions, nested incompatible copies and runtime/declaration major-minor alignment. After npm ci, npm ls validates the installed peer graph. Seven positive/negative fixtures protect these rules without a separate runner. Existing lint, typecheck, contracts, tests and build remain required.

For a future upgrade, review official framework support, dependency advisories and migration notes; regenerate the lockfile using the supported Node version; run the guard, npm ci, installed graph checks, full release CI and current mobile E2E. Do not interpret compatibility checks as a vulnerability assessment. Review full npm audit output, including development dependencies, separately from the mandatory production audit. The current billing restriction prevents full CI confirmation.

## Runtime hardening
- Studio settings reads have a bounded timeout, exact two-product validation, document visibility handling and no hidden-tab polling.
- Checkout status reads are cancelled on replacement/unmount/account changes; unavailable status clears prior checkout eligibility. Product changes remount the scoped component. A synchronous lock prevents overlapping create/cancel/claim actions; server-side authorization and checkout transaction logic remain unchanged.
- Room orbit suspends animation on hidden tabs, cleans up listeners and releases its WebGL context. Context loss falls back to the existing 2D room view.
- Root layout failures have an independent global error boundary, without showing raw exception details.
- Full npm advisory counts are diagnostic; production audit remains a mandatory gate. React Server Components security advisories concern framework/RSC implementations, not just the React DOM version: https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components. Do not claim current dependency versions are vulnerability-free before npm audit and advisory review complete. No unverified package upgrade was applied.
- Existing browser smoke and release checks remain required. Runtime and performance measurements require actual browser execution. Do not claim that all memory leaks or hydration problems have been eliminated.
