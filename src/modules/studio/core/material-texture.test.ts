import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {materialTextureBytes,MATERIAL_TILE_SIZE,type TexturedFinish} from "./material-texture.ts";
test("shared material tiles are deterministic, opaque, bounded and preserve reviewed profile samples",()=>{
 const finishes:TexturedFinish[]=["tile","marble","wood","panel","acp"];
 for(const profile of ["residential","commercial"] as const){
  const hashes=new Set<string>();
  for(const finish of finishes){
   const data=materialTextureBytes(finish,profile);
   assert.equal(data.length,MATERIAL_TILE_SIZE**2*4);
   assert.deepEqual(data,materialTextureBytes(finish,profile));
   assert.ok(data.every((v,i)=>i%4!==3||v===255));
   hashes.add(createHash("sha256").update(data).digest("hex"));
  }
  assert.equal(hashes.size,5);
 }
 assert.equal(materialTextureBytes("tile","residential")[0],120);
 assert.equal(materialTextureBytes("tile","commercial")[0],158);
});

test("cached material templates never expose shared mutable texture memory",()=>{
 const a=materialTextureBytes("tile","residential"),b=materialTextureBytes("tile","residential");
 assert.notEqual(a.buffer,b.buffer);
 a.fill(0);
 assert.deepEqual(b,materialTextureBytes("tile","residential"));
 assert.equal(b[3],255);
});
