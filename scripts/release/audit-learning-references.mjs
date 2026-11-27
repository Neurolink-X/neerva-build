// Run manually: node --experimental-strip-types scripts/release/audit-learning-references.mjs
// This maintenance check is deliberately not in the site runtime or build gate.
import {globalMethods,referenceReview} from "../../src/modules/home/practical-field-guide.ts";
import {knowledgeSources} from "../../src/modules/home/knowledge-hub.ts";
const entries=[...globalMethods.map(m=>({label:m.source,url:m.url})),...knowledgeSources];
const unique=[...new Map(entries.map(e=>[e.url,e])).values()];
async function check(entry){
 try{
  const u=new URL(entry.url);
  if(u.protocol!=="https:"||u.username||u.password)return {label:entry.label,state:"review",reason:"Unsafe URL"};
  const r=await fetch(u,{method:"HEAD",redirect:"manual",signal:AbortSignal.timeout(8000)});
  return {label:entry.label,url:entry.url,state:r.ok?"reachable":"review",status:r.status,reason:r.ok?"":"Redirect, unavailable or HEAD not supported; inspect manually."};
 }catch{return {label:entry.label,url:entry.url,state:"review",reason:"Network unavailable or timeout; inspect manually."};}
}
const results=[];
for(let i=0;i<unique.length;i+=4)results.push(...await Promise.all(unique.slice(i,i+4).map(check)));
console.log(JSON.stringify({lastEditorialReview:referenceReview.date,checkedAt:new Date().toISOString(),results},null,2));
// A failed source link does not remove local content or fail a production build.
