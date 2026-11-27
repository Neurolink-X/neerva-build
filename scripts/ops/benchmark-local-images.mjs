import assert from "node:assert/strict";
import {statSync} from "node:fs";
import {performance} from "node:perf_hooks";
assert.equal(process.env.NEERVA_E2E_DISPOSABLE,"yes");
assert.equal(process.env.NEERVA_E2E_LOCAL,"yes");
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,"http://127.0.0.1:54321");
const assets=[
 ["/images/knowledge/future/mixed-use-building.webp",70000],
 ["/images/knowledge/future/modern-apartments.webp",70000],
 ["/images/knowledge/future/climate-smart-apartments.webp",70000],
 ["/images/studio/family/neerva-100gaj-photorealistic.webp",150000]
];
const reports=[];
for(const [path,budget] of assets){
 const stored=statSync("public"+path).size;assert.ok(stored<=budget,path+" exceeds byte budget");
 const samples=[];
 for(let i=0;i<3;i++){
  const start=performance.now(),r=await fetch("http://127.0.0.1:3000"+path,{redirect:"error",signal:AbortSignal.timeout(8000)});
  assert.equal(r.status,200);assert.match(r.headers.get("content-type")??"",/^image\/webp/);
  const bytes=(await r.arrayBuffer()).byteLength;assert.equal(bytes,stored);
  samples.push({ms:Math.round(performance.now()-start),bytes,cacheControl:r.headers.get("cache-control")});
 }
 reports.push({path,budget,stored,samples});
}
console.log(JSON.stringify({scope:"isolated local HTTP delivery; not CDN or real Android field performance",reports},null,2));
