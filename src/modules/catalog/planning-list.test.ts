import assert from "node:assert/strict";
import test from "node:test";
import { appendPlanningLine, isPlanningUnit, safePlanningList, PLANNING_STORAGE_KEY } from "./planning-list.ts";

const cement = {id:"material-0001",name:"PPC cement 50 kg",quantity:12,unit:"bag" as const};

test("material product click and manual list share a single storage key",()=>{
 assert.equal(PLANNING_STORAGE_KEY,"neerva-planning-material-list-v1");
 assert.deepEqual(appendPlanningLine([],cement),[cement]);
 assert.ok(isPlanningUnit("cubic_metre"));
 assert.equal(isPlanningUnit("unchecked"),false);
});
test("list parser refuses invalid and oversized or duplicate records",()=>{
 assert.deepEqual(safePlanningList([{...cement,quantity:-1},{...cement,unit:"invalid"}]),[]);
 assert.equal(safePlanningList([cement,cement]).length,1);
 assert.equal(safePlanningList([{...cement,quantity:Infinity}]).length,0);
 assert.equal(safePlanningList([{...cement,name:" "}]).length,0);
});
test("local list allows 25 entries max and rejects the 26th",()=>{
 const rows=Array.from({length:25},(_,n)=>({...cement,id:"material-"+String(n).padStart(6,"0")}));
 assert.equal(safePlanningList(rows).length,25);
 assert.equal(appendPlanningLine(rows,{...cement,id:"material-9999"}).length,25);
});
test("parsing removes untrusted extra fields and trims values",()=>{
 const parsed=safePlanningList([{...cement,name:"  Cement  ",admin:true,price:1}]);
 assert.deepEqual(parsed,[{...cement,name:"Cement"}]);
});
