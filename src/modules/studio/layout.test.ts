import test from "node:test";import assert from "node:assert/strict";import {generate,conceptRules} from "./layout.ts";
test("plot validity, bounded rooms, stable multi-floor plan",()=>{
  assert.equal(generate({width:2000,depth:3000,beds:2,floors:1,road:"N",facing:"N",parking:false}),null);
  for(const width of [4500,6000,7500,9000,12000])for(const depth of [9000,12000,18000]){
    const p=generate({width,depth,beds:3,floors:2,road:"N",facing:"N",parking:true});
    assert.ok(p);assert.equal(p.plates.length,2);
    for(const plate of p.plates)for(const r of plate.rooms){
      assert.ok(r.w>0&&r.h>0);assert.ok(r.x>=0&&r.y>=0);
      assert.ok(r.x+r.w<=width&&r.y+r.h<=depth);
    }
  }
});
test("fixed concept rules are immutable in the result and no real pricing claims",()=>{
 const input={width:18000,depth:18000,beds:3,floors:2,road:"N" as const,facing:"W" as const,parking:true};
 const a=generate(input,conceptRules),b=generate(input,conceptRules);assert.deepEqual(a,b);
 assert.match(a!.notice,/Concept only/);
});
