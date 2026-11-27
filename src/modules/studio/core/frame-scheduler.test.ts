import test from "node:test";
import assert from "node:assert/strict";
import {createFrameScheduler} from "./frame-scheduler.ts";
test("both viewers can coalesce frames, pause hidden tabs and never render after disposal",()=>{
 let visible=true,draws=0,next=0;const frames=new Map<number,()=>void>();
 const scheduler=createFrameScheduler(()=>draws++,{request:cb=>{frames.set(++next,cb);return next;},cancel:id=>{frames.delete(id);},hidden:()=>!visible});
 const tick=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(cb=>cb());};
 scheduler.schedule();scheduler.schedule();assert.equal(frames.size,1);tick();assert.equal(draws,1);
 scheduler.schedule();visible=false;scheduler.visibility();assert.equal(frames.size,0);scheduler.schedule();tick();assert.equal(draws,1);
 visible=true;scheduler.visibility();tick();assert.equal(draws,2);
 scheduler.schedule();scheduler.dispose();scheduler.schedule();tick();assert.equal(draws,2);
});
