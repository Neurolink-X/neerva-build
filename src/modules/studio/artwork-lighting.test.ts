import test from "node:test";
import assert from "node:assert/strict";
import {shadeArtworkPixels} from "./artwork-lighting.ts";
test("photo light applies once and preserves transparent areas and alpha",()=>{const pixels=new Uint8ClampedArray([100,150,200,255,100,150,200,128,100,150,200,0,200,100,50,255]);shadeArtworkPixels(pixels,new Uint8Array([190,95,190,255]),2,0,0,2);assert.deepEqual([...pixels],[100,150,200,255,50,75,100,128,100,150,200,0,255,134,67,255]);});

test("bounded artwork rectangle samples correct source rows and preserves transparency",()=>{const pixels=new Uint8ClampedArray([100,100,100,255,100,100,100,0,100,100,100,255,100,100,100,255]);shadeArtworkPixels(pixels,new Uint8Array([0,0,0,0,190,95,0,0,95,190,0,0]),4,0,1,2);assert.deepEqual([...pixels],[100,100,100,255,100,100,100,0,50,50,50,255,100,100,100,255]);});

test("fine deterministic pigment grain preserves alpha and does not modify source luminance",()=>{const data=new Uint8ClampedArray(64).fill(120),original=data.slice(),luma=new Uint8Array(16).fill(190);data[3]=0;const other=data.slice();shadeArtworkPixels(data,luma,4,0,0,4,.035);shadeArtworkPixels(other,luma,4,0,0,4,.035);assert.deepEqual(data,other);assert.deepEqual([...data.slice(0,4)],[120,120,120,0]);assert.ok(data.some((v,i)=>i%4!==3&&v!==original[i]));assert.ok(luma.every(v=>v===190));});
