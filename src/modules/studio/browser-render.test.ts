import test from "node:test";
import assert from "node:assert/strict";
import {intersectBox,renderScene,type RenderJob,type RenderFrame} from "../../../public/studio-render-v1.js";
test("ray hits actual box surface and rejects parallel misses",()=>{
 const hit=intersectBox([0,0,-3],[0,0,1],[-1,-1,-1],[1,1,1]);
 assert.ok(hit);assert.equal(hit.t,2);assert.deepEqual(hit.normal,[0,0,-1]);
 assert.equal(intersectBox([3,0,-3],[0,0,1],[-1,-1,-1],[1,1,1]),null);
});
test("browser ray tracer renders different actual geometry, reports progress and limits resource use",()=>{
 const job:RenderJob={boxes:[{lo:[-1,-1,-1],hi:[1,1,1],color:[.6,.2,.1],opacity:1,metal:0,rough:.8}],camera:{origin:[0,0,-4],forward:[0,0,1],right:[-1,0,0],up:[0,1,0],fov:45},width:24,height:24,samples:2,evening:false};
 const frames:RenderFrame[]=[];renderScene(job,f=>frames.push(f));assert.equal(frames.length,2);assert.equal(frames[1].completed,2);assert.equal(frames[1].pixels.length,24*24*4);
 const moved:RenderFrame[]=[];renderScene({...job,boxes:[{...job.boxes[0],lo:[4,4,4],hi:[6,6,6]}]},f=>moved.push(f));assert.notDeepEqual(frames[1].pixels,moved[1].pixels);
 assert.throws(()=>renderScene({...job,width:9000},()=>{}),/Unsupported/);
});
