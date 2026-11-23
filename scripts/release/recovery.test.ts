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
test("production release contract retains original source inventory and pins sensitive routes",()=>{
 const gate=readFileSync("scripts/release/production-gate.mjs","utf8");
 const contract=JSON.parse(readFileSync("release/production-contract.json","utf8"));
 assert.match(gate,/validateProductionContract/);
 assert.equal(contract.version,2);
 assert.equal(contract.referenceDeployment,"dpl_GBZpLhjcXvCdihSX7Lfd2YqBwnZF");
 assert.ok(contract.baselineFiles.length>=100);
 assert.ok(contract.baselineFiles.includes("src/app/api/orders/route.ts"));
 assert.match(contract.protectedGitBlobs["src/app/api/orders/route.ts"],/^[a-f0-9]{40}$/);
});


/** These tests must be stable on both GitHub CI and Vercel production,
 * where real NEXT_PUBLIC_* values exist. Never inherit external release
 * credentials into an intentionally invalid release-gate fixture.
 */
const fixtureEnv={
 PATH:process.env.PATH??"",
 VERCEL_ENV:"preview",
 VERCEL_GIT_COMMIT_REF:"feature-test",
 VERCEL_GIT_COMMIT_SHA:"a".repeat(40),
 NEXT_PUBLIC_SUPABASE_URL:"https://wrong-database.example.invalid",
 NEXT_PUBLIC_SUPABASE_ANON_KEY:"intentionally-invalid-not-a-real-publishable-key",
 NEERVA_RELEASE_APPROVED_SHA:"a".repeat(40)
};
function ignoredBuildStep(env:Record<string,string>,ci=false){
 return spawnSync(process.execPath,["scripts/release/production-gate.mjs",...(ci?["--check"]:[])],{
  env,encoding:"utf8",timeout:10000
 });
}
test("preview ignored-build step permits previews despite wrong production credentials",()=>{
 const result=ignoredBuildStep({...fixtureEnv,VERCEL_ENV:"preview"});
 assert.equal(result.error,undefined);
 assert.equal(result.status,1,result.stderr);
});
test("production ignored-build step SKIPS with wrong project URL, no secrets inherited",()=>{
 const result=ignoredBuildStep({...fixtureEnv,VERCEL_ENV:"production",VERCEL_GIT_COMMIT_REF:"main"});
 assert.equal(result.error,undefined);
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stderr,/Production Supabase URL must point to the isolated Neerva project/);
});
test("production CI --check fails closed with wrong project URL",()=>{
 const result=ignoredBuildStep({...fixtureEnv,VERCEL_ENV:"production",VERCEL_GIT_COMMIT_REF:"main"},true);
 assert.equal(result.status,1,result.stderr);
});
test("production with syntactically valid dedicated Neerva public credentials permits BUILD; --check passes",()=>{
 const env={...fixtureEnv,VERCEL_ENV:"production",VERCEL_GIT_COMMIT_REF:"main",
  NEXT_PUBLIC_SUPABASE_URL:"https://djgghisbkucprqiezrcn.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:"sb_publishable_"+"0".repeat(52)
 };
 assert.equal(ignoredBuildStep(env).status,1,"Vercel build step: exit 1 means build");
 assert.equal(ignoredBuildStep(env,true).status,0,"CI check: exit 0 means pass");
});
