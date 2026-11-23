# Secure Vercel authorization for Phase 1 source recovery

The Vercel and GitHub connectors are already connected, but the Vercel tool truncates large file responses. **Never paste an access token in a chat or commit it.** This one-time workflow uses a temporary credential stored only in a GitHub Actions secret.

## Authorization steps (one-time, user-controlled)

1. Open https://vercel.com/account/tokens, log in to the account/team owning Neerva Build, and create a new personal access token with the narrowest available **team scope** for the Neerva project, and a short expiry (for example one day). Record the token securely; it is displayed only when created.
2. Open https://github.com/Neurolink-X/neerva-build/settings/secrets/actions. Under **Repository secrets**, select **New repository secret**. Name it exactly \`NEERVA_VERCEL_TOKEN\`, paste the token into the secret value field and save. Do not put the token in a GitHub repository variable, PR comment, Vercel client env, or chatbot.
3. Open https://github.com/Neurolink-X/neerva-build/actions/workflows/phase1-source-recovery.yml and select **Run workflow** on \`main\`. The workflow is manual only. It downloads the upload-backed source for \`dpl_GBZpLhjcXvCdihSX7Lfd2YqBwnZF\`, checks each full-file SHA-1/size and SHA-256, scans for obvious secrets, and opens a **draft** GitHub PR adding only missing files.
4. Review the PR's \`docs/production-source-recovery-report.json\` and check shared files individually. Do not overwrite the new Studio / Dealer / Homepage code just because the legacy production source differs.
5. Run lint, typecheck, unit and true customer/dealer/mobile E2E regression. Only then create a release parity attestation and explicitly enable a controlled live release. Do not lift the current production deployment guard prematurely.
6. **Revoke the Vercel token** from the Vercel tokens page and delete the \`NEERVA_VERCEL_TOKEN\` repository secret after successful export.

If the GitHub Actions token cannot create a PR, the workflow may have pushed a recovery branch successfully. Open a PR manually from \`recovery/phase1-vercel-source-<run-id>\`.

### Limits

- The workflow still needs a Vercel token created by the account owner; the connected MCP tool cannot export unrestricted binary source through its truncated response.
- A Vercel endpoint that responds \`404\` with a valid source UID may indicate inaccessible upload contents, not an authentication problem. Check its workflow log and recover that file from the original local upload/backups if necessary.
- The temporary public-image recovery endpoint lives on a separate preview branch and is NOT part of this workflow or production.
