import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
test("source-recovery script never writes secrets to git and requires explicit token",()=>{
 const s=readFileSync("scripts/release/recover-vercel-source.mjs","utf8");
 assert.match(s,/process\.env\.VERCEL_TOKEN/);
 assert.match(s,/SHA1 mismatch/);
 assert.match(s,/Output directory must be empty/);
 assert.match(s,/\.env/);
});
test("production release guard fails closed with source parity + attestation",()=>{
 const s=readFileSync("scripts/release/production-gate.mjs","utf8");
 assert.match(s,/src\/app\/api\/orders\/route\.tsx|src\/app\/api\/orders\/route\.ts/);
 assert.match(s,/production-parity-approved\.json/);
 assert.match(s,/data\.approvedCommitSha !== sha/);
});
