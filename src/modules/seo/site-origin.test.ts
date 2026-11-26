import test from "node:test";
import assert from "node:assert/strict";
import {canonicalPublicOrigin,customDomainCutoverReady,canonicalRedirects} from "./site-origin.ts";
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

test("www canonical follows current apex-to-www routing without reverse redirect",()=>{
 const env={VERCEL_ENV:"production",NEXT_PUBLIC_SITE_URL:"https://www.neerva.in",NEERVA_CUSTOM_DOMAIN_ACTIVE:"true"};
 assert.equal(canonicalPublicOrigin(env),"https://www.neerva.in");
 const redirects=canonicalRedirects(env);
 assert.deepEqual(redirects.map(r=>r.has[0].value),["neerva-build.vercel.app","neerva.in"]);
 assert.ok(redirects.every(r=>r.destination==="https://www.neerva.in/:path*"&&r.permanent));
 assert.deepEqual(canonicalRedirects({...env,VERCEL_ENV:"preview"}),[]);
 assert.deepEqual(canonicalRedirects({...env,NEERVA_CUSTOM_DOMAIN_ACTIVE:"false"}),[]);
 const apex=canonicalRedirects({...env,NEXT_PUBLIC_SITE_URL:"https://neerva.in"});
 assert.ok(apex.some(r=>r.has[0].value==="www.neerva.in"));
 assert.ok(apex.every(r=>r.has[0].value!=="neerva.in"));
});
