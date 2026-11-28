import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio} from "./road-generator.ts";
import {streetRenderSnapshot} from "./street-render.ts";
import type {PlanBrief} from "./plan-model.ts";
const brief:PlanBrief={widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("street render uses real plan geometry, bounded primitives and a road-relative camera",()=>{
 const p=generateSpatialPortfolio(brief,2).plans[0];assert.ok(p);
 const a=streetRenderSnapshot(p),b=streetRenderSnapshot(p,undefined,"front",true);
 assert.ok(a.boxes.length>20&&a.boxes.length<=2500);
 assert.ok(a.boxes.every(o=>o.lo.every((v,i)=>Number.isFinite(v)&&v<o.hi[i])));
 assert.ok(a.camera.origin[2]<0&&a.camera.forward[2]>0);
 assert.ok(Math.abs(Math.hypot(...a.camera.forward)-1)<1e-6);
 assert.ok(Math.abs(a.camera.forward.reduce((sum,v,i)=>sum+v*a.camera.right[i],0))<1e-6);
 assert.deepEqual(a.boxes,b.boxes);assert.notDeepEqual(a.camera.origin,b.camera.origin);assert.equal(b.evening,true);
 const changed=streetRenderSnapshot({...p,facade:{...p.facade,main:"#112233"}});
 assert.notDeepEqual(a.boxes,changed.boxes);
 assert.deepEqual(streetRenderSnapshot(p),a);
});
test("street geometry changes with a distinct checked plan, not merely a facade image",()=>{
 const [p,q]=generateSpatialPortfolio(brief,2).plans;assert.ok(p&&q);
 assert.notDeepEqual(streetRenderSnapshot(p).boxes,streetRenderSnapshot(q).boxes);
});
