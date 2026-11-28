import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {publicIndexingEnabled} from "./indexing.ts";
import {canonicalPublicOrigin,canonicalRedirects} from "./site-origin.ts";
const source=(path:string)=>readFileSync(new URL("../../../"+path,import.meta.url),"utf8");
test("public production canonical follows www redirect and preview indexing remains disabled",()=>{const env={VERCEL_ENV:"production",NEXT_PUBLIC_SITE_URL:"https://www.neerva.in",NEXT_PUBLIC_SITE_INDEXABLE:"true",NEERVA_CUSTOM_DOMAIN_ACTIVE:"true"};assert.equal(publicIndexingEnabled(env),true);assert.equal(canonicalPublicOrigin(env),"https://www.neerva.in");assert.equal(publicIndexingEnabled({...env,VERCEL_ENV:"preview"}),false);assert.ok(canonicalRedirects(env).every(r=>r.has[0].value!=="www.neerva.in"));});
test("public studio tools have self canonical and sitemap coverage without overriding preview safety",()=>{for(const slug of ["visualizer","buildings"]){const p=source("src/app/design-studio/"+slug+"/page.tsx");assert.match(p,new RegExp('canonical:\\s*"/design-studio/'+slug+'"'));assert.doesNotMatch(p,/robots:\s*\{\s*index:\s*(true|false)/);assert.ok(source("src/app/sitemap.ts").includes("/design-studio/"+slug));}});
test("private routes remain excluded from search headers and robots",()=>{for(const path of ["/account","/admin","/dealer","/api","/basket","/quotes","/checkout","/orders","/my-project"]){assert.ok(source("src/app/robots.ts").includes('"'+path+'"'));assert.ok(source("next.config.ts").includes('"'+path+'"'));}assert.match(source("next.config.ts"),/noindex, nofollow/);});
