import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
const base=new URL(process.argv[2]??"https://neerva-build.vercel.app");
assert.ok(["https://neerva-build.vercel.app","http://127.0.0.1:3000"].includes(base.origin),"Only Neerva public origin or local preview allowed");
const routes=[["/",2500],["/materials",2500],["/design-studio",2500],["/blog",2500],["/learn",2500],["/brands",2500],["/api/catalog",1000],["/api/catalog/prices",1000],["/api/studio/config",1000]];
const report=[];
for(const [path,budget] of routes){
 const times=[];let failed=0;
 for(let i=0;i<5;i++){
  const start=performance.now();
  try{
   const r=await fetch(new URL(path,base),{redirect:"error",signal:AbortSignal.timeout(8000)});
   await r.arrayBuffer();
   if(!r.ok)failed++;
   else times.push(Math.round(performance.now()-start));
  }catch{failed++;}
 }
 times.sort((a,b)=>a-b);
 const p95=times.length?times[Math.ceil(times.length*.95)-1]:null;
 report.push({path,samples:5,failed,p95Ms:p95,budgetMs:budget,status:failed?"error":p95>budget?"slow":"ok"});
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),origin:base.origin,method:"five sequential GETs per route; not a load test",routes:report},null,2));
if(report.some(r=>r.status==="error"))process.exitCode=1;
if(process.env.NEERVA_ENFORCE_LATENCY==="yes"&&report.some(r=>r.status==="slow"))process.exitCode=1;
