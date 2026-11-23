# NEERVA BUILD: permanent production release contract v2

## Why production was repeatedly CANCELED

The former Vercel Ignored Build Step invoked `scripts/release/production-gate.mjs`, which required `release/production-parity-approved.json` and a matching `NEERVA_RELEASE_APPROVED_SHA` environment variable. Neither was generated as part of the actual delivery workflow. Vercel treats exit 0 from the **Ignored Build Step** as "skip build", so merged releases were silently marked CANCELED even when CI had passed.

The old recovery report was point-in-time, not current parity evidence. Current inventory audit located all 106 source/asset paths from reference deployment `dpl_GBZpLhjcXvCdihSX7Lfd2YqBwnZF` inside Git. **Same filenames do not mean byte-for-byte equality**. Current legitimate changes to basket, order API, Design Studio and styling require tests, not a permanent freeze to old file hashes.

## What is protected now

1. `release/production-contract.json`: every original production source/asset path is required, together with current essential Design Studio, materials and smoke-test paths.
2. High-risk backend/auth/quote/price/order/tenant and original layout files plus all four Supabase migrations have **reviewed Git blob SHA-1 hashes** pinned in the same contract. Editing these files without explicitly updating the contract fails CI and production eligibility. This is a change-review flag, not a cryptographic signature or substitute for branch protection.
3. `npm run release:verify` (exit 0 pass, exit 1 fail) runs on every PR, push to main, and mobile E2E job.
4. In Vercel's **Ignored Build Step**, `node scripts/release/production-gate.mjs` means exit 1 to BUILD after contract passes; exit 0 to SKIP with a specific problem message if the contract fails.
5. In Vercel's **Build Command**, `npm run release:verify && npm run lint && npm run typecheck && npm test && npm run build` ensures a production candidate with a broken lint, TypeScript, unit suite or build becomes ERROR rather than silently serving a broken app.
6. Production Vercel environment must point exclusively at Neerva project `djgghisbkucprqiezrcn`, not AuroWater. Service-role credentials are never needed in a client build.

## Routine releases and emergency response

- Regular UI change: update code; pass CI and local mobile browser E2E; merge after review. No env SHA rotation.
- Protected-code change: explain business effect, update corresponding `protectedGitBlobs` value in the release contract **from the reviewed Git tree** after tests pass; obtain reviewer approval; rerun CI and authenticated/RLS E2E where relevant.
- Missing legacy file: restore it or explicitly approve replacement with equivalent routing and regression evidence. Never remove an old path only to silence the inventory check.
- Failed deployment: inspect Vercel build logs and GitHub checks. A Vercel CANCELED from the gate means source/contract mismatch; an ERROR means installation/lint/typecheck/tests/build failed. Do not call preview READY a production release.
- After production READY: verify domain alias SHA, protected API fail-closed responses, homepage, material-to-basket-to-quote, two plot sizes, and console/runtime errors. Record rollback candidate.
- Source parity is *functional continuity*, NOT a guarantee that every old line is unchanged. Historical binaries/large source need separate byte-for-byte provenance inspection before claiming original identity.

## Limitations and upgrades

The private GitHub repository currently cannot enforce a required-check branch rule on its connected plan; these CI workflows are visible and must be reviewed before merging. A malicious writer with repository-admin control can change both source and contract. Production would be stronger with GitHub branch protection + required reviews or Vercel **required Deployment Checks** configured in the dashboard. Do not claim this contract itself provides tamper-proof external approval.

Authenticated customer/dealer/admin two-tenant E2E remains a separate acceptance requirement before enabling new order/RFQ/dealer write flows. The release contract intentionally does not claim those are production-ready. Supabase project creation and migrations alone are not API integration proof.

## Validation commands

```bash
npm ci
npm run release:verify
npm run lint
npm run typecheck
npm test
npm run build
```

Use Vercel's required Deployment Checks UI when available (Build and Deployment), and leave account-level production approval controls active. Do **not** disable the checks when a specific contract error needs correction.
