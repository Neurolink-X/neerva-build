import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {lintIssues} from "./eslint-toolchain.mjs";
const fixture=()=>[JSON.parse(readFileSync("package.json","utf8")),JSON.parse(readFileSync("package-lock.json","utf8"))];
test("current toolchain is aligned",()=>assert.deepEqual(lintIssues(...fixture()),[]));
test("reject divergent Next config version",()=>{const [p,l]=fixture();p.devDependencies["eslint-config-next"]="0.0.0";assert(lintIssues(p,l).some(x=>x.includes("same release")));});
test("reject lockfile drift",()=>{const [p,l]=fixture();l.packages["node_modules/eslint"].version="0.0.0";assert(lintIssues(p,l).some(x=>x.includes("lock mismatch")));});
test("reject mixed nested ESLint majors",()=>{const [p,l]=fixture();l.packages["node_modules/example/node_modules/eslint"]={version:"0.0.0"};assert(lintIssues(p,l).some(x=>x.includes("Mixed ESLint")));});
test("reject floating toolchain versions",()=>{const [p,l]=fixture();p.devDependencies.eslint="^9.0.0";assert(lintIssues(p,l).some(x=>x.includes("exact stable")));});

test("reject aligned but unreviewed ESLint major",()=>{const [p,l]=fixture();p.devDependencies.eslint="10.0.0";l.packages[""].devDependencies.eslint="10.0.0";l.packages["node_modules/eslint"].version="10.0.0";assert(lintIssues(p,l).some(x=>x.includes("reviewed major")));});
test("malformed nested lock entry fails closed",()=>{const [p,l]=fixture();l.packages["node_modules/example/node_modules/eslint"]=null;assert(lintIssues(p,l).some(x=>x.includes("Mixed ESLint")));});

test("reject aligned but unreviewed TypeScript major before dependency install",()=>{
 const [p,l]=fixture();p.devDependencies.typescript="7.0.2";l.packages[""].devDependencies.typescript="7.0.2";l.packages["node_modules/typescript"].version="7.0.2";
 assert(lintIssues(p,l).some(x=>x.includes("reviewed compiler major")));
});
test("reject TypeScript manifest and lockfile drift",()=>{
 const [p,l]=fixture();l.packages["node_modules/typescript"].version="5.0.0";assert(lintIssues(p,l).some(x=>x.includes("typescript manifest/lock mismatch")));
});
test("reject floating TypeScript versions",()=>{
 const [p,l]=fixture();p.devDependencies.typescript="^5.9.3";assert(lintIssues(p,l).some(x=>x.includes("typescript must be an exact stable version")));
});
test("reject mixed or malformed nested TypeScript entries",()=>{
 for(const entry of [{version:"7.0.2"},null]){
  const [p,l]=fixture();l.packages["node_modules/example/node_modules/typescript"]=entry;assert(lintIssues(p,l).some(x=>x.includes("Mixed TypeScript")));
 }
});
test("Dependabot blocks unreviewed TypeScript major upgrades without blocking patches",()=>{
 const config=readFileSync(".github/dependabot.yml","utf8");
 assert.match(config,/- dependency-name: typescript\s+update-types: \["version-update:semver-major"\]/);
});
