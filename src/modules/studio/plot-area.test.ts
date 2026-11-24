import test from "node:test";
import assert from "node:assert/strict";
import {depthFromGaj,gajFromFeet} from "./plot-area.ts";
test("real gaj area needs frontage, never invents site geometry",()=>{
 for(const [gaj,width,depth] of [[120,20,54],[130,26,45],[140,20,63],[150,30,45]] as const){
  assert.equal(depthFromGaj(gaj,width),depth);
  assert.equal(gajFromFeet(width,depth),gaj);
 }
 assert.equal(depthFromGaj(120,0),null);
 assert.equal(depthFromGaj(120,2),null);
 assert.equal(depthFromGaj(120,200),null);
 assert.equal(depthFromGaj(Number.NaN,20),null);
 assert.equal(depthFromGaj(150,20),67.5);
});
