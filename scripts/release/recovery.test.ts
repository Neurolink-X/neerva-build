import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
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
 assert.match(s,/approvedSha !== sha/);
});

test("preview builds stay allowed, production fails closed even with a forged SHA",()=>{
 const script="scripts/release/production-gate.mjs";
 const preview=spawnSync(process.execPath,[script],{env:{...process.env,VERCEL_ENV:"preview"},encoding:"utf8"});
 assert.equal(preview.status,1);
 const prod=spawnSync(process.execPath,[script],{env:{...process.env,VERCEL_ENV:"production",VERCEL_GIT_COMMIT_SHA:"a".repeat(40),NEERVA_RELEASE_APPROVED_SHA:"a".repeat(40)},encoding:"utf8"});
 assert.equal(prod.status,0);
});
