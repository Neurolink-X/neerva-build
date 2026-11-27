import test from "node:test";
import assert from "node:assert/strict";
import {buildSurfaceTile,surfaceProfiles,SURFACE_TILE_SIZE} from "./surface-texture.ts";
test("premium finish masks are deterministic, distinct, non-flat and memory bounded",()=>{
 const signatures=new Set<string>();
 for(const p of surfaceProfiles){
  const tile=buildSurfaceTile(p),again=buildSurfaceTile(p);assert.deepEqual(tile,again);
  assert.equal(tile.length,SURFACE_TILE_SIZE**2*4);
  const alpha=tile.filter((_,i)=>i%4===3);
  assert.ok(new Set(alpha).size>=20,p+" needs genuine tonal variation");
  assert.ok(Math.max(...alpha)-Math.min(...alpha)>=28,p+" needs visible depth");
  signatures.add(Array.from(alpha.slice(0,320)).join(","));
 }
 assert.equal(signatures.size,surfaceProfiles.length);
 assert.throws(()=>buildSurfaceTile("marble",1024),RangeError);
});
