import test from "node:test";
import assert from "node:assert/strict";
import {generateBuildingConcepts,type BuildingBrief} from "./building-purpose.ts";
import {generateSpatialPortfolio} from "./road-generator.ts";
import {createProjectExchange,conceptTakeoff,reviewedQuoteHref,type ProjectSource} from "./project-exchange.ts";
const commercial:BuildingBrief={purpose:"shops",widthFt:100,depthFt:120,roadSide:"E",floors:2,unitsPerFloor:4,parkingBays:0,frontFt:10,rearFt:10,sideFt:5};
test("residential and commercial share one versioned exchange without inventing quantities",async()=>{
 const c=generateBuildingConcepts(commercial,1).plans[0];
 const h=generateSpatialPortfolio({widthFt:40,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}},1).plans[0];
 assert.ok(c&&h);
 for(const source of [{kind:"commercial",plan:c},{kind:"residential",plan:h}] as ProjectSource[]){
  const model=await createProjectExchange(source);
  assert.equal(model.schemaVersion,1);assert.equal(model.approval,"CONCEPT_ONLY");assert.equal(model.planId,source.plan.id);
  assert.match(model.geometryDigest,/^[a-f0-9]{64}$/);
  assert.equal((await createProjectExchange(source)).geometryDigest,model.geometryDigest);
  for(const q of model.quantities){assert.ok(q.sourceIds.every(id=>model.spaces.some(s=>s.id===id)));assert.ok(Number.isFinite(q.quantity)&&q.quantity>=0);}
  assert.ok(model.quantities.filter(q=>q.category!==null).every(q=>q.category==="paint"));
  if(source.kind==="commercial")assert.ok(model.quantities.every(q=>q.category===null));
 }
 const bad={kind:"commercial",plan:{...c,zones:[]}} as const;
 assert.deepEqual(conceptTakeoff(bad),[]);await assert.rejects(createProjectExchange(bad));
});
test("procurement handoff rejects mismatched unit, fractional pieces and missing specification",()=>{
 assert.equal(reviewedQuoteHref("steel","litre",5,"Fe500D"),null);
 assert.equal(reviewedQuoteHref("cement","bag",1.5,"PPC cement"),null);
 assert.equal(reviewedQuoteHref("paint","litre",5," "),null);
 const href=reviewedQuoteHref("paint","litre",12.5,"Interior paint");assert.ok(href);
 const url=new URL(href,"https://example.invalid");assert.equal(url.pathname,"/quotes");assert.equal(url.searchParams.get("quantity"),"12.5");
});
