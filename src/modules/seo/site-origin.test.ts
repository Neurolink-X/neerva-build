import test from "node:test";
import assert from "node:assert/strict";
import {canonicalPublicOrigin,customDomainCutoverReady} from "./site-origin.ts";
import {publicIndexingEnabled} from "./indexing.ts";
test("a domain move cannot redirect or index until explicitly approved and active",()=>{
 const existing={NEXT_PUBLIC_SITE_URL:"https://neerva-build.vercel.app"};
 assert.equal(canonicalPublicOrigin(existing),"https://neerva-build.vercel.app");
 assert.equal(customDomainCutoverReady(existing),false);
 const proposed={NEXT_PUBLIC_SITE_URL:"https://neerva.in"};
 assert.equal(canonicalPublicOrigin(proposed),"https://neerva-build.vercel.app");
 assert.equal(customDomainCutoverReady(proposed),false);
 const switched={...proposed,NEERVA_CUSTOM_DOMAIN_ACTIVE:"true",VERCEL_ENV:"production",NEXT_PUBLIC_SITE_INDEXABLE:"true"};
 assert.equal(canonicalPublicOrigin(switched),"https://neerva.in");
 assert.equal(customDomainCutoverReady(switched),true);
 assert.equal(publicIndexingEnabled(switched),true);
 assert.equal(publicIndexingEnabled({...switched,NEERVA_CUSTOM_DOMAIN_ACTIVE:"false"}),false);
 assert.equal(publicIndexingEnabled({...switched,VERCEL_ENV:"preview"}),false);
});
test("untrusted request-style URLs never become canonical site origins",()=>{
 for(const unsafe of ["https://neerva.in.evil.example","https://evil.example","http://neerva.in","https://neerva.in/invalid","https://neerva.in?redirect=x"]){
  assert.equal(canonicalPublicOrigin({NEXT_PUBLIC_SITE_URL:unsafe,NEERVA_CUSTOM_DOMAIN_ACTIVE:"true"}),"https://neerva-build.vercel.app");
  assert.equal(customDomainCutoverReady({NEXT_PUBLIC_SITE_URL:unsafe,NEERVA_CUSTOM_DOMAIN_ACTIVE:"true"}),false);
 }
});
