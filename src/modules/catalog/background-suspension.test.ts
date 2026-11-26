import test from "node:test";
import assert from "node:assert/strict";
import {createBackgroundSuspension,BACKGROUND_GRACE_MS} from "./background-suspension.ts";
test("brief background switches do not churn realtime and long background releases it once",t=>{
 t.mock.timers.enable({apis:["setTimeout"]});
 let hidden=true,stops=0;
 const lifecycle=createBackgroundSuspension(()=>{stops++},()=>hidden);
 lifecycle.schedule();t.mock.timers.tick(BACKGROUND_GRACE_MS-1);
 assert.equal(stops,0);hidden=false;lifecycle.cancel();t.mock.timers.tick(BACKGROUND_GRACE_MS);assert.equal(stops,0);
 hidden=true;lifecycle.schedule();lifecycle.schedule();t.mock.timers.tick(BACKGROUND_GRACE_MS);assert.equal(stops,1);
 t.mock.timers.tick(BACKGROUND_GRACE_MS);assert.equal(stops,1);
 hidden=true;lifecycle.schedule();hidden=false;t.mock.timers.tick(BACKGROUND_GRACE_MS);assert.equal(stops,1);
 lifecycle.cancel();
});
