import test from "node:test";
import assert from "node:assert/strict";
import {patternGroups} from "./wall-patterns.ts";
import {paintExecution} from "./paint-execution.ts";
import {practicalPaintNames,practicalPaintShade} from "./practical-paint-art.ts";
import {generateWallRaster} from "./generated-wall-raster.ts";
test("all 72 curated interior designs have actionable paint guidance",()=>{for(const p of Object.values(patternGroups).flat()){const e=paintExecution(p);assert.ok(e,p);assert.ok(e.execution&&e.finish&&e.coverage&&e.maintenance,p);}});
test("replacement paint designs have distinct, bounded full-wall tonal composition",()=>{const keys=Object.keys(practicalPaintNames) as (keyof typeof practicalPaintNames)[],seen=new Set<string>();for(const p of keys){const r=generateWallRaster(p,96,64);assert.equal(r.values.length,6144);assert.ok(new Set(r.values).size>20,p);seen.add(r.values.join(","));for(const x of [0,.5,1])for(const y of [0,.5,1]){const v=practicalPaintShade(p,x,y);assert.ok(Number.isFinite(v)&&v>=0&&v<=1,p);}}assert.equal(seen.size,keys.length);});

import {isFeatureWall} from "./wall-design-guide.ts";
import {isPracticalPaintArt} from "./practical-paint-art.ts";
test("every Modern and Geometry composition uses full-wall paint raster",()=>{for(const key of [...patternGroups.Modern,...patternGroups.Geometry]){assert.ok(isPracticalPaintArt(key),key);assert.equal(isFeatureWall(key),false,key);}});
