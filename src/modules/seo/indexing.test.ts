import test from "node:test";
import assert from "node:assert/strict";
import {publicIndexingEnabled} from "./indexing.ts";
test("production can index only with explicit verified HTTPS site flag",()=>{
 const vars={VERCEL_ENV:"production",NEXT_PUBLIC_SITE_INDEXABLE:"true",NEXT_PUBLIC_SITE_URL:"https://neerva-build.vercel.app"};
 assert.equal(publicIndexingEnabled(vars),true);
 for(const env of [
  {...vars,VERCEL_ENV:"preview"},{...vars,VERCEL_ENV:"development"},
  {...vars,NEXT_PUBLIC_SITE_INDEXABLE:"false"},
  {...vars,NEXT_PUBLIC_SITE_URL:"http://neerva-build.vercel.app"},
  {...vars,NEXT_PUBLIC_SITE_URL:"https://localhost"},
  {...vars,NEXT_PUBLIC_SITE_URL:"https://neerva-build.vercel.app/other"}
 ])assert.equal(publicIndexingEnabled(env),false);
});

test("only an exact, activated custom origin can be indexed",()=>{
 const env={VERCEL_ENV:"production",NEXT_PUBLIC_SITE_INDEXABLE:"true",NEERVA_CUSTOM_DOMAIN_ACTIVE:"true",NEXT_PUBLIC_SITE_URL:"https://neerva.in"};
 assert.equal(publicIndexingEnabled(env),true);
 for(const url of ["https://neerva.in:8443","https://user@neerva.in","https://neerva.in/","https://neerva.in?x=1","https://neerva.in.evil.example","https://neerva-build.vercel.app:8443"]){
  assert.equal(publicIndexingEnabled({...env,NEXT_PUBLIC_SITE_URL:url}),false,url);
 }
 assert.equal(publicIndexingEnabled({...env,NEERVA_CUSTOM_DOMAIN_ACTIVE:"false"}),false);
});

test("verified www origin can be indexed only on production with cutover enabled",()=>{
 const env={VERCEL_ENV:"production",NEXT_PUBLIC_SITE_INDEXABLE:"true",NEERVA_CUSTOM_DOMAIN_ACTIVE:"true",NEXT_PUBLIC_SITE_URL:"https://www.neerva.in"};
 assert.equal(publicIndexingEnabled(env),true);
 assert.equal(publicIndexingEnabled({...env,NEERVA_CUSTOM_DOMAIN_ACTIVE:"false"}),false);
 assert.equal(publicIndexingEnabled({...env,VERCEL_ENV:"preview"}),false);
});
