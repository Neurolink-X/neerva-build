import test from "node:test";
import assert from "node:assert/strict";
import {generateRoadPlans,pickDiverse,planSignature} from "./road-generator.ts";
import {validatePlan,overlapArea,planMetrics,wallBoxes,recolorMasked,sharedEdge,type PlanBrief} from "./plan-model.ts";
const brief=(changes:Partial<PlanBrief>={}):PlanBrief=>({
 widthFt:18,depthFt:50,roadSide:"N",floors:1,bedrooms:1,parking:true,
 setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0},...changes
});
test("18×50 G 1BHK: two actually distinct road-front plans, car, gate, veranda, bedroom, stair and wash",()=>{
 const {plans,blockers}=generateRoadPlans(brief());
 assert.deepEqual(blockers,[]);assert.equal(plans.length,2);
 assert.equal(new Set(plans.map(planSignature)).size,2);
 for(const p of plans){
  assert.deepEqual(validatePlan(p),[]);
  assert.equal(p.plot.widthFt*p.plot.depthFt,900);
  assert.equal(p.parking?.clearDepthFt,16);
  assert.ok((p.parking?.clearWidthFt??0)>=8);
  assert.equal(p.gate.side,"front");assert.equal(p.pedestrianGate.side,"front");assert.equal(p.rooms.find(r=>r.id==="verandah")?.y,0);
  assert.ok(p.rooms.some(r=>r.kind==="living"));
  assert.ok(p.rooms.some(r=>r.kind==="kitchen"));
  assert.ok(p.rooms.some(r=>r.kind==="stairs"));
  assert.ok(p.rooms.some(r=>r.kind==="utility"));
  assert.equal(p.rooms.filter(r=>r.kind==="bedroom").length,1);
  const m=planMetrics(p);assert.ok(m.roomFloorSqFt>400);
  assert.ok(m.netPaintSqM>0&&m.paintLitres>0);
  assert.match(m.note,/not an itemised construction BOQ/);
 }
});
test("18×50 G+1: valid vertical stairs, upper bedrooms and same-model balcony",()=>{
 for(const beds of [2,3]){
  const {plans,blockers}=generateRoadPlans(brief({floors:2,bedrooms:beds}));
  assert.equal(blockers.length,0,blockers.join(" / "));assert.equal(plans.length,2);
  for(const p of plans){
   assert.deepEqual(validatePlan(p),[]);
   assert.equal(p.floors,2);
   assert.equal(p.stairs.roomIds.length,2);
   assert.equal(p.rooms.filter(r=>r.kind==="bedroom").length,beds);
   assert.ok(p.rooms.some(r=>r.kind==="balcony"&&r.floor===1));
  }
 }
});
test("all four road directions use the same local y=0 entry geometry, not the opposite edge",()=>{
 for(const roadSide of ["N","E","S","W"] as const){
  const {plans}=generateRoadPlans(brief({roadSide}));
  assert.equal(plans.length,2);
  for(const p of plans){
   assert.equal(p.plot.roadSide,roadSide);
   assert.equal(p.rooms.find(r=>r.kind==="verandah")?.y,0);
   assert.equal(p.rooms.find(r=>r.kind==="parking")?.y,0);
   assert.equal(p.gate.side,"front");
  }
 }
});
test("impossible 3BHK+parking on 15×30 and 18×50 G 2BHK never falsely claim fit",()=>{
 const a=generateRoadPlans(brief({widthFt:15,depthFt:30,bedrooms:3,floors:2}));
 assert.equal(a.plans.length,0);assert.ok(a.blockers.some(b=>b.includes("3BHK")));
 const b=generateRoadPlans(brief({bedrooms:2,floors:1}));
 assert.equal(b.plans.length,0);assert.match(b.blockers.join(" "),/G\+1/);
 const c=generateRoadPlans(brief({setbacks:{frontFt:2,rearFt:2,leftFt:1,rightFt:1}}));
 assert.equal(c.plans.length,0);assert.ok(c.blockers.length);
});
test("each plan floor has no overlapping room areas and stays within the usable plot",()=>{
 const {plans}=generateRoadPlans(brief({floors:2,bedrooms:3}));
 for(const p of plans){
  for(let i=0;i<p.rooms.length;i++)for(let j=i+1;j<p.rooms.length;j++)
   if(p.rooms[i].floor===p.rooms[j].floor)assert.ok(overlapArea(p.rooms[i],p.rooms[j])<.01);
  const r=p.rooms.find(x=>x.id==="dining")!,s=p.rooms.find(x=>x.id==="stairs-g")!;
  assert.ok(sharedEdge(r,s));
 }
});
test("door/window wall cutouts preserve sill/lintel and reject overlap or out-of-bounds",()=>{
 const boxes=wallBoxes(12,9.5,[{atFt:2,widthFt:3,sillFt:0,heightFt:7},{atFt:7,widthFt:3,sillFt:3,heightFt:4}]);
 assert.ok(boxes.some(b=>b.x0===2&&b.x1===5&&b.y0===7&&b.y1===9.5));
 assert.ok(boxes.some(b=>b.x0===7&&b.x1===10&&b.y0===0&&b.y1===3));
 assert.throws(()=>wallBoxes(12,9.5,[{atFt:2,widthFt:4,sillFt:0,heightFt:7},{atFt:5,widthFt:3,sillFt:0,heightFt:7}]),RangeError);
 assert.throws(()=>wallBoxes(12,9.5,[{atFt:11,widthFt:3,sillFt:0,heightFt:7}]),RangeError);
});
test("recolour uses original pixels, preserves brightness hierarchy and feathered mask without mutation",()=>{
 const original=new Uint8ClampedArray([40,40,40,255,160,160,160,255,60,60,60,255]);
 const mask=new Uint8ClampedArray([255,255,0]);
 const first=recolorMasked(original,mask,[180,90,75]),second=recolorMasked(original,mask,[180,90,75]);
 assert.deepEqual(first,second);
 assert.deepEqual(original,new Uint8ClampedArray([40,40,40,255,160,160,160,255,60,60,60,255]));
 assert.ok(first[0]<first[4],"dark texture remains darker");
 assert.deepEqual([...first.slice(8,12)],[60,60,60,255]);
 assert.deepEqual(recolorMasked(original,new Uint8ClampedArray(3),[180,90,75]),original);
 assert.throws(()=>recolorMasked(original,new Uint8ClampedArray(2),[180,90,75]),RangeError);
});
test("different score order cannot duplicate same physical layout",()=>{
 const {plans}=generateRoadPlans(brief());
 assert.equal(pickDiverse([plans[0],plans[0],plans[1]],3).length,2);
});
