import test from "node:test";
import assert from "node:assert/strict";
import {renderScene,intersectBox,type RenderJob,type RenderBox} from "../../../../public/studio-render-v1.js";
const box=(x:number):RenderBox=>({lo:[x,0,0],hi:[x+.7,1,1],color:[.7,.6,.5],opacity:1,rough:.8,metal:0});
test("ray traversal produces deterministic opaque frames and rejects unsupported sizes",()=>{
 const job:RenderJob={boxes:Array.from({length:12},(_,i)=>box(i-6)),camera:{origin:[0,2,-5],forward:[0,0,1],right:[1,0,0],up:[0,1,0],fov:45},width:16,height:16,samples:2,evening:false};
 const first:Uint8ClampedArray[]=[],second:Uint8ClampedArray[]=[];
 renderScene(job,frame=>first.push(frame.pixels));
 renderScene(job,frame=>second.push(frame.pixels));
 assert.equal(first.length,2);assert.deepEqual(first,second);
 assert.ok(first[1].every((v,i)=>i%4!==3||v===255));
 assert.throws(()=>renderScene({...job,width:999},()=>{}),/Unsupported/);
});
test("box rays handle inside origins, parallel misses and bounded distances",()=>{
 assert.equal(intersectBox([0,0,0],[1,0,0],[-1,-1,-1],[1,1,1])?.t,1);
 assert.equal(intersectBox([0,2,0],[1,0,0],[-1,-1,-1],[1,1,1]),null);
 assert.equal(intersectBox([0,0,0],[1,0,0],[2,-1,-1],[3,1,1],1),null);
});
