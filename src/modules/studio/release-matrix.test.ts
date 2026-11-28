import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio,generateCoveredUpperPortfolio,generateEnclosedUpperPortfolio,generateUsableUpperPortfolio,physicalPlanSignature,portfolioForPlanId,planSignature,validateRequestedProgramme} from "./road-generator.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {buildingWallCells} from "./geometry.ts";
import {streetRenderSnapshot} from "./street-render.ts";
import {renderScene,type RenderFrame} from "../../../public/studio-render-v1.js";
import type {PlanBrief,RoadSide} from "./plan-model.ts";

const plots=[[15,30],[18,50],[20,40],[25,40],[30,50],[40,60]] as const;
const directions:RoadSide[]=["N","E","S","W"];
const setbacks={frontFt:0,rearFt:0,leftFt:0,rightFt:0};
function check(b:PlanBrief){
 const result=generateSpatialPortfolio(b,1);
 const plans=[...result.plans,...generateCoveredUpperPortfolio(b)];
 if(!plans.length){assert.ok(result.blockers.length,"An unsupported input needs a reason: "+JSON.stringify(b));return false;}
 assert.equal(new Set(plans.map(p=>p.id)).size,plans.length);
 assert.equal(new Set(plans.map(planSignature)).size,plans.length);
 for(const p of plans){
  assert.deepEqual(validateRequestedProgramme(p,b),[],JSON.stringify(b)+" "+p.id);
  const d=studioDesignFromPlan(p);
  assert.equal(d.id,p.id);assert.equal(d.bedrooms,b.bedrooms);assert.equal(d.floors,b.floors);
  assert.ok(buildingWallCells(d).length>0);
 }
 return true;
}
test("release matrix: six plot presets, 1–6 BHK, G to G+2, parking on/off, rotating orientations",{timeout:180000},()=>{
 let checked=0,feasible=0;
 for(const [w,d] of plots)for(const floors of [1,2,3] as const)for(let bedrooms=1;bedrooms<=6;bedrooms++)for(const parking of [true,false]){
  const roadSide=directions[checked%directions.length];
  if(check({widthFt:w,depthFt:d,roadSide,floors,bedrooms,parking,setbacks}))feasible++;
  checked++;
 }
 assert.equal(checked,216);assert.ok(feasible>0&&feasible<checked);
 console.log(JSON.stringify({suite:"preset-matrix",checked,feasible,rejected:checked-feasible}));
});
test("all road directions preserve exact inputs for representative 18x50 and 36x65 briefs",{timeout:60000},()=>{
 for(const roadSide of directions)for(const floors of [1,2,3] as const){
  const b:PlanBrief={widthFt:36,depthFt:65,roadSide,floors,bedrooms:floors+1,parking:true,setbacks};
  assert.ok(check(b));
 }
 for(const roadSide of directions)assert.ok(check({widthFt:18,depthFt:50,roadSide,floors:2,bedrooms:3,parking:true,setbacks}));
});
test("actual street ray tracer returns complete nonblank opaque pixels with different daylight/evening frames",()=>{
 const b:PlanBrief={widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks};
 const p=generateSpatialPortfolio(b,1).plans[0];assert.ok(p);
 function image(evening:boolean){
  const frames:RenderFrame[]=[];
  renderScene({...streetRenderSnapshot(p,undefined,"corner",evening),width:72,height:48,samples:2},frame=>frames.push(frame));
  const frame=frames.at(-1);assert.ok(frame);assert.equal(frame.completed,2);
  assert.equal(frame.pixels.length,72*48*4);
  const rgb=new Set<number>();for(let i=0;i<frame.pixels.length;i+=4){assert.equal(frame.pixels[i+3],255);rgb.add(frame.pixels[i]*65536+frame.pixels[i+1]*256+frame.pixels[i+2]);}
  assert.ok(rgb.size>30,"Render must not be a single colour or blank placeholder");
  return frame.pixels;
 }
 assert.notDeepEqual(image(false),image(true));
});

test("shared upper-floor upgrade applies across supported widths, depths, 1–6 BHK and floors", {timeout:180000},()=>{
 let checked=0,upgraded=0;const sizes=new Set<string>(),counts=new Set<number>();
 for(const [widthFt,depthFt] of [[15,30],[18,50],[20,40],[25,40],[30,50],[40,60],[36,65]] as const)
 for(const floors of [2,3] as const)for(let bedrooms=1;bedrooms<=6;bedrooms++){
  const brief:PlanBrief={widthFt,depthFt,floors,bedrooms,parking:widthFt>=18,roadSide:directions[checked%4],setbacks};
  const base=generateSpatialPortfolio(brief,3).plans;
  const specific=generateEnclosedUpperPortfolio(brief);
  const generic=generateUsableUpperPortfolio(brief,base,2);
  const all=[...specific,...generic];checked++;
  for(const p of all){
   assert.deepEqual(validateRequestedProgramme(p,brief),[],p.id);
   assert.ok(p.rooms.filter(r=>r.kind==="bedroom").length===bedrooms);
   assert.ok(portfolioForPlanId(brief,p.id).plans.some(q=>q.id===p.id&&physicalPlanSignature(q)===physicalPlanSignature(p)),p.id+" restores exact geometry");
   sizes.add(widthFt+"x"+depthFt);counts.add(bedrooms);upgraded++;
  }
 }
 assert.equal(checked,84);assert.ok(sizes.size>=2,"upgrade cannot be confined to one plot");
 console.log(JSON.stringify({suite:"all-residential-upper",checked,upgraded,plotSizes:[...sizes],bedroomCounts:[...counts]}));
});
