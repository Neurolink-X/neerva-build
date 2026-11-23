# Phase 1 Vercel production recovery and release gate

**Status:** GitHub PRs #5, #6 and #7 have been merged, but the GitHub source is NOT yet equivalent to the live Phase 1 Vercel upload. A protected Vercel Ignored Build Step currently blocks automatic production builds to prevent rollbacks.

## Why this is needed
The live upload deployment \`dpl_GBZpLhjcXvCdihSX7Lfd2YqBwnZF\` has 112 files under its original \`src/\` upload directory. GitHub main initially matched paths for 48, subsequently 50 files after merging the newer PRs; not all matching files are necessarily content-identical. Bulk source downloaded via the ChatGPT Vercel connector was **truncated**, not suitable for Git blobs. Git-pushing incomplete recovery caused a broken preview and was reversed.

## Procedure on a trusted machine with Git/Vercel access
1. Use **Node 24** and a temporary Vercel token authorized to read the specific deployment. Set \`VERCEL_TOKEN\` in the terminal environment; optionally \`VERCEL_TEAM_ID\`. Never place the token in commands, Git, logs, URLs, screenshots or files. Rotate it afterward.
2. From the Neerva repository root run:
   \`node scripts/release/recover-vercel-source.mjs --deployment dpl_GBZpLhjcXvCdihSX7Lfd2YqBwnZF --out ../neerva-vercel-source\`
3. Carefully inspect \`source-recovery-manifest.json\`, confirm complete binary/content SHA checks and screen for secrets and personally identifying values **before** any copy.
4. On a new Git branch run \`node scripts/release/stage-missing-vercel-source.mjs ../neerva-vercel-source\`. This copies **missing files only**. It generates \`docs/production-source-recovery-report.json\` showing shared-file divergences. Review those differences individually; preserve PR5/6/7 functionality. Do not blindly overwrite shared files.
5. Add CI regression coverage for Phase 1 routes (plan, 2D/3D/color, basket, quote, order/tracking) and Phase 2. Run \`npm ci\`, lint, typecheck, unit and E2E, build, mobile Lighthouse, and compare the preview. Verify RLS and database isolation before enabling dealer or order endpoints.
6. Generate \`release/production-parity-approved.json\` with \`productionSourceId\` and a \`requiredHashes\` list of all critical files and their current SHA-256 hashes. Commit it after the tests and review. **This is an attestation, not a security signature**: protect who can edit it with branch protection and review requirements.
7. Set Vercel config variable \`NEERVA_RELEASE_APPROVED_SHA\` to the **exact reviewed main Git SHA** (this cannot be embedded in that commit itself). Enable the Vercel Ignored Build Step \`node scripts/release/production-gate.mjs\` after this script has been merged and confirmed to run on preview. The guard exits 0 (skip) for unapproved production commits; 1 means allow build. To revoke, unset the config variable.
8. Deploy the approved commit to a dedicated production test deployment; verify every critical route and API, then promote and compare live behavior. Audit Vercel deployment source SHA and aliases. Keep the previous deployment for immediate rollback.

### Important limits
- The exporter uses Vercel deployment-file API paths that require direct runtime verification on a trusted machine; a syntactically correct recovery script does **not** prove that production source was recovered.
- Git CI green does not establish production source parity or order-service readiness.
- Do not silently turn off the existing production guard. Do not enable paid services.
