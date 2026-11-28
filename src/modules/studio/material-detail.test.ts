import test from "node:test";
import assert from "node:assert/strict";
import {applyMaterialDetail,materialDetail} from "./material-detail.ts";
import {wallMaterialDetail} from "./detailed-wall-recipes.ts";
import {patternGroups} from "./wall-patterns.ts";
import {textureFor} from "./wall-textures.ts";
test("all 64 procedural designs use bounded material-specific detail; eight photo textures are unchanged",()=>{const keys=Object.values(patternGroups).flat();let count=0;for(const key of keys){const profile=wallMaterialDetail(key);if(textureFor(key)){assert.equal(profile,undefined,key);continue;}assert.ok(profile,key);count++;for(let i=0;i<100;i++)assert.ok(materialDetail(i*7,i*13,profile)>.7&&materialDetail(i*7,i*13,profile)<1.3,key);}assert.equal(count,64);});
test("material detail preserves alpha and transparency and is deterministic",()=>{const source=new Uint8ClampedArray(4*9).fill(140);source[3]=0;source[7]=255;const a=source.slice(),b=source.slice(),p=wallMaterialDetail("sculptDiamond")!;applyMaterialDetail(a,3,3,p);applyMaterialDetail(b,3,3,p);assert.deepEqual(a,b);assert.deepEqual(a.slice(0,4),source.slice(0,4));for(let i=3;i<a.length;i+=4)assert.equal(a[i],source[i]);assert.notDeepEqual(a,source);});
test("wash, relief and panel rendering differ at the same source geometry",()=>{const source=new Uint8ClampedArray(4*64).fill(150);const results=["desertDunes","sculptDiamond","palazzoPanel"].map(key=>{const d=source.slice();applyMaterialDetail(d,8,8,wallMaterialDetail(key as "desertDunes"|"sculptDiamond"|"palazzoPanel")!);return JSON.stringify([...d]);});assert.equal(new Set(results).size,3);});
