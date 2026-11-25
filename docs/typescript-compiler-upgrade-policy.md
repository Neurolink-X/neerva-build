# TypeScript compiler upgrade policy

PR #60 attempted TypeScript 5.9.3 → 7.0.2. CI run 45552022891 failed lint with `typescript-eslint does not support TS 7.0.` The currently locked parser/plugin 8.73.0 declares a TypeScript peer range of >=4.8.4 <6.1.0. Retain the reviewed TypeScript 5.9.3 and exact original lockfile from main. Do not downgrade the parser, suppress lint, use force installs, or introduce a second compiler to work around this.

- Dependabot may continue patch/minor updates. Major updates need a coordinated review.
- Before npm ci, validate exact compiler version, reviewed major, manifest/root lock alignment and mixed nested compiler entries.
- After npm ci, verify the installed peer dependency graph, lint, typecheck, contract tests, unit tests, production build and mobile regression.
- To adopt a new compiler major, first confirm Next.js and every installed TypeScript ESLint peer supports the exact target, then update the manifest, lock and compatibility policy together. Keep tests strict and compare output.
- This resolves the known unsupported-major failure path; it does not claim future TypeScript releases are unsupported forever.
