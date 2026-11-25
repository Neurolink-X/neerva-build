import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {upstashIssues} from "./upstash-peer.mjs";
const fixture=()=>[JSON.parse(readFileSync("package.json","utf8")),JSON.parse(readFileSync("package-lock.json","utf8"))];
test("current compatible locked pair passes",()=>assert.deepEqual(upstashIssues(...fixture()),[]));
test("reject a higher minimum Redis peer before npm ci",()=>{const [p,l]=fixture();const v=p.dependencies["@upstash/redis"].split(".").map(Number);l.packages["node_modules/@upstash/ratelimit"].peerDependencies["@upstash/redis"]="^"+[v[0],v[1]+1,0].join(".");assert.ok(upstashIssues(p,l).some(x=>x.includes("peer incompatible")));});
test("reject lock drift",()=>{const [p,l]=fixture();l.packages[""].dependencies["@upstash/redis"]="0.0.0";assert.ok(upstashIssues(p,l).length);});
test("fail closed on an unknown peer range",()=>{const [p,l]=fixture();l.packages["node_modules/@upstash/ratelimit"].peerDependencies["@upstash/redis"]="*";assert.ok(upstashIssues(p,l).length);});
