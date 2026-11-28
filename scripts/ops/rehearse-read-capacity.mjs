// Bounded capacity rehearsal against the disposable CI server only; no production traffic.
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
assert.equal(process.env.NEERVA_E2E_DISPOSABLE,"yes");assert.equal(process.env.NEERVA_E2E_LOCAL,"yes");assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,"http://127.0.0.1:54321");
const base="http://127.0.0.1:3000";
const routes=["/api/catalog","/api/catalog/prices","/api/catalog/offers","/api/studio/config","/materials","/","/design-studio/visualizer","/design-studio/road-planner","/design-studio/buildings","/calculators","/room-lab","/brands"];
const results=[];
for(const concurrency of [5,15,30]){
 const samples=[];const start=performance.now();
 await Promise.all(Array.from({length:concurrency},(_,worker)=>(async()=>{for(let i=0;i<3;i++){
  const path=routes[(worker+i)%routes.length],t=performance.now();
  try{const r=await fetch(base+path,{redirect:"error",signal:AbortSignal.timeout(15000)});await r.arrayBuffer();samples.push({path,status:r.status,ms:Math.round(performance.now()-t)});}
  catch{samples.push({path,status:0,ms:Math.round(performance.now()-t)});}
 }})()));
 const times=samples.map(s=>s.ms).sort((a,b)=>a-b),fail=samples.filter(s=>s.status!==200);
 const byRoute=routes.map(path=>{const group=samples.filter(s=>s.path===path),latency=group.map(s=>s.ms).sort((a,b)=>a-b);return {path,samples:group.length,failed:group.filter(s=>s.status!==200).length,p95Ms:latency.length?latency[Math.ceil(latency.length*.95)-1]:null};});
 results.push({concurrency,requests:samples.length,failed:fail.length,p95Ms:times[Math.ceil(times.length*.95)-1],durationMs:Math.round(performance.now()-start),byRoute,failures:fail});
}
console.log(JSON.stringify({scope:"isolated read capacity rehearsal; not production capacity or unique signed-in users",results},null,2));
assert.ok(results.every(r=>r.failed===0),"Read load must not generate errors");
