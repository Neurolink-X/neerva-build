#!/usr/bin/env node
/**
 * Vercel Ignored Build Step: exit 0 = SKIP, exit 1 = BUILD.
 * This is fail-closed until live Phase 1 source is restored and all required
 * functionality is represented in Git. Does not expose credentials.
 */
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const production = process.env.VERCEL_ENV === "production";
if (!production) process.exit(1);
const required = [
 "src/app/basket/page.tsx", "src/app/api/orders/route.ts",
 "src/app/account/orders/page.tsx", "src/app/account/quotes/page.tsx",
 "src/app/admin/catalog/page.tsx", "src/app/admin/pricing/page.tsx",
 "src/app/admin/rfqs/page.tsx", "src/app/admin/studio/page.tsx",
 "src/app/dealer/quotes/page.tsx", "src/app/dealer/inventory/page.tsx",
 "src/app/design-studio/studio.css", "src/components/material-basket.tsx",
 "src/components/room-orbit.tsx", "src/modules/studio/room.ts",
 "public/images/catalog/cement-sack.webp", "public/images/catalog/tmt-bars.webp",
 "src/app/design-studio/library/page.tsx", "src/app/premium-home.css"
];
const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
 console.error("NEERVA production deploy blocked: Phase 1 file parity incomplete: " + missing.length + " critical source files missing.");
 process.exit(0);
}
const attestation = "release/production-parity-approved.json";
if (!existsSync(attestation)) {
 console.error("NEERVA production deploy blocked: no signed-off parity attestation.");
 process.exit(0);
}
let data;
try { data = JSON.parse(readFileSync(attestation, "utf8")); } catch { process.exit(0); }
const sha = process.env.VERCEL_GIT_COMMIT_SHA;
if (!sha || data.approvedCommitSha !== sha || data.productionSourceId !== "dpl_GBZpLhjcXvCdihSX7Lfd2YqBwnZF") {
 console.error("NEERVA production deploy blocked: release attestation does not match this commit.");
 process.exit(0);
}
if (!Array.isArray(data.requiredHashes) || data.requiredHashes.length !== required.length) process.exit(0);
for (const file of required) {
 const row = data.requiredHashes.find((entry) => entry.path === file);
 if (!row || !/^[a-f0-9]{64}$/i.test(row.sha256)) process.exit(0);
 const actual = createHash("sha256").update(readFileSync(file)).digest("hex");
 if (actual !== row.sha256) {
  console.error("NEERVA production deploy blocked: protected file changed: " + file);
  process.exit(0);
 }
}
console.log("NEERVA release gate passed for " + sha);
process.exit(1);
