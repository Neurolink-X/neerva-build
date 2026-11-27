import test from "node:test";
import assert from "node:assert/strict";
import {renderScene,type RenderJob} from "../../../public/studio-render-v1.js";
const job:RenderJob={width:16,height:16,samples:2,evening:false,camera:{origin:[0,1,-4],forward:[0,0,1],right:[1,0,0],up:[0,1,0],fov:55},boxes:[{lo:[-1,0,0],hi:[1,2,2],color:[.6,.7,.8],opacity:.35,rough:.15,metal:0},{lo:[-3,-.2,-3],hi:[3,0,4],color:[.7,.6,.5],opacity:1,rough:.7,metal:0,finish:"wood"}],lights:[{position:[0,3,0],color:[1,.9,.8],power:10}]};
test("bounded renderer produces deterministic, opaque progressive frames",()=>{
 const run=()=>{const frames:Uint8ClampedArray[]=[];renderScene(job,frame=>{assert.equal(frame.pixels.length,1024);assert.equal(frame.width,16);assert.ok(frame.pixels.every((v,i)=>i%4!==3||v===255));frames.push(frame.pixels);});return frames;};
 const a=run(),b=run();assert.equal(a.length,2);assert.deepEqual(a,b);assert.ok(new Set(a[1]).size>4);
});
test("renderer fails closed on invalid camera or malformed scene",()=>{
 assert.throws(()=>renderScene({...job,camera:{...job.camera,fov:NaN}},()=>{}),/camera/);
 assert.throws(()=>renderScene({...job,camera:{...job.camera,right:[0,0,1]}},()=>{}),/orientation/);
 assert.throws(()=>renderScene({...job,boxes:[{...job.boxes[0],lo:[1,0,0]}]},()=>{}),/geometry/);
 assert.throws(()=>renderScene({...job,boxes:[{...job.boxes[0],rough:2}]},()=>{}),/material/);
});
