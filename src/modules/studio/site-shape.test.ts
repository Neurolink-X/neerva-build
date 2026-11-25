import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio} from "./road-generator.ts";
import {rectInsideShape,shapeErrors,siteAreaSqFt,siteOutline,conservativeEnvelope} from "./site-shape.ts";
import {validatePlan,type PlanBrief} from "./plan-model.ts";
const base:PlanBrief={widthFt:20,depthFt:60,roadSide:"N",floors:2,bedrooms:3,parking:true,
 setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("real L-shaped rear-left parcel uses conservative interior envelope; no room on missing land",()=>{
 const siteShape={kind:"rear-left-notch",notchWidthFt:2,notchDepthFt:10} as const;
 const model=generateSpatialPortfolio({...base,siteShape},24);
 assert.ok(model.plans.length>0,model.blockers.join(" / "));
 assert.equal(siteAreaSqFt(20,60,siteShape),1180);
 assert.equal(siteOutline(20,60,siteShape).length,6);
 assert.equal(conservativeEnvelope(20,60,siteShape,base.setbacks).leftFt,2);
 for(const p of model.plans){
  assert.deepEqual(validatePlan(p),[],p.id);
  assert.deepEqual(p.plot.siteShape,siteShape);
  assert.equal(p.setbacks.leftFt,2);
  assert.equal(p.plot.widthFt,20);
  assert.ok(p.rooms.every(room=>rectInsideShape(room,20,60,siteShape)),p.id+" crosses missing land");
  assert.match(p.notes.join(" "),/cadastral site survey/);
  assert.ok(p.id.includes(siteShape.kind), "Notched plot identity must include its shape");
 }
});
test("real rear-right L parcel mirrors missing corner, while car entry stays at road",()=>{
 const siteShape={kind:"rear-right-notch",notchWidthFt:2,notchDepthFt:12} as const;
 const {plans,blockers}=generateSpatialPortfolio({...base,roadSide:"E",siteShape},24);
 assert.ok(plans.length>0,blockers.join(" / "));
 for(const p of plans){
  assert.deepEqual(validatePlan(p),[],p.id);
  assert.equal(p.setbacks.rightFt,2);
  assert.equal(p.plot.roadSide,"E");
  assert.ok(p.rooms.every(room=>rectInsideShape(room,20,60,siteShape)));
  assert.equal(p.gate.side,"front");
  assert.match(p.notes.join(" "),/cadastral site survey/);
  assert.ok(p.id.includes(siteShape.kind), "Notched plot identity must include its shape");
 }
});
test("unsafe L-plot notch or too-small remaining frontage is rejected without fake architecture",()=>{
 const shape={kind:"rear-left-notch",notchWidthFt:6,notchDepthFt:12} as const;
 assert.equal(generateSpatialPortfolio({...base,siteShape:shape}).plans.length,0);
 assert.ok(generateSpatialPortfolio({...base,siteShape:shape}).blockers.some(x=>x.includes("17.5")));
 assert.ok(shapeErrors(20,60,{kind:"rear-left-notch",notchWidthFt:10,notchDepthFt:12}).length>0);
 const model=generateSpatialPortfolio({...base});
 assert.ok(model.plans.length>0);
 const modified={...model.plans[0],plot:{...model.plans[0].plot,siteShape:{kind:"rear-left-notch" as const,notchWidthFt:9,notchDepthFt:20}}};
 assert.ok(validatePlan(modified).some(e=>e.includes("outside usable plot")));
});
