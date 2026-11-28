import test from "node:test";
import assert from "node:assert/strict";
import {motifPigment,motifStops} from "./wall-pigment.ts";
import {generateWallRaster} from "./generated-wall-raster.ts";
import {paintTexturePalette} from "./wall-textures.ts";
import {artworkMotifs} from "./wall-patterns.ts";
test("reference-inspired geometry is distinct, multitone and adjustable",()=>{const a=artworkMotifs("hexGrid"),b=artworkMotifs("facets"),c=artworkMotifs("angularWeave");assert.ok(a.length>b.length);assert.ok(a.every(m=>!m.filled),"hexagon fallback is painted wirework, not filled tiles");assert.ok(c.every(m=>!m.filled));assert.ok(new Set(a.map(m=>motifPigment(m,"#e5d9c7","#436a6b"))).size>1);const m=b[0];assert.notDeepEqual(motifStops(m,"#e5d9c7","#436a6b"),motifStops(m,"#102a40","#cda64c"));assert.ok(motifStops(m,"#e5d9c7","#436a6b").every(([t,c])=>t>=0&&t<=1&&/^#[0-9a-f]{6}$/i.test(c)));});

test("painted geometry has different real raster compositions and adjustable pigments",()=>{const keys=["hexGrid","facets","angularWeave"] as const;const rasters=keys.map(k=>generateWallRaster(k,120,80));assert.equal(new Set(rasters.map(r=>r.values.join(","))).size,3);const palette=paintTexturePalette("#e5d9c7","#436a6b"),other=paintTexturePalette("#102a40","#cda64c");assert.notDeepEqual(palette,other);for(const r of rasters)assert.ok(new Set(r.values).size>35);});
