## ESLint major compatibility policy

Keep ESLint 9.39.1 and Next.js 16.4.6 on the current verified dependency pair. The proposed ESLint 10.15.0 lockfile contains eslint-plugin-import 2.32.0, eslint-plugin-jsx-a11y 6.10.2 and eslint-plugin-react 7.37.5, whose declared ESLint peer ranges exclude version 10. No nested ESLint 9 appears in that lockfile. A passing earlier isolated workflow does not establish support for this combined dependency graph.

Dependabot may still propose ESLint patch and minor releases. Reassess major updates when all selected plugins declare compatible peer ranges; remove the major exclusion, regenerate the lockfile normally, and verify npm ci, lint, typecheck, unit tests, production build, and mobile regression on the exact PR head. Do not force peer resolution or skip lint. The current runner-allocation failure is separate from the observed dependency compatibility risk.
