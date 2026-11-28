import test from "node:test";
import assert from "node:assert/strict";
import {motifPigment,motifStops} from "./wall-pigment.ts";
import {artworkMotifs} from "./wall-patterns.ts";
test("reference-inspired geometry is distinct, multitone and adjustable",()=>{const a=artworkMotifs("hexGrid"),b=artworkMotifs("facets"),c=artworkMotifs("angularWeave");assert.ok(a.length>b.length);assert.ok(a.some(m=>m.filled));assert.ok(c.every(m=>!m.filled));assert.ok(new Set(a.map(m=>motifPigment(m,"#e5d9c7","#436a6b"))).size>5);const m=a[0];assert.notDeepEqual(motifStops(m,"#e5d9c7","#436a6b"),motifStops(m,"#102a40","#cda64c"));assert.ok(motifStops(m,"#e5d9c7","#436a6b").every(([t,c])=>t>=0&&t<=1&&/^#[0-9a-f]{6}$/i.test(c)));});
