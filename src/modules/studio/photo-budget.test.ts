import test from "node:test";
import assert from "node:assert/strict";
import {encodedPhotoDimensions,photoDimensionsAllowed,paintPreviewDimensions} from "./photo-budget.ts";
test("compressed file size cannot bypass decoded pixel and side budgets",()=>{
 assert.ok(photoDimensionsAllowed(4000,3000));assert.equal(photoDimensionsAllowed(8000,8000),false);
 for(const v of [0,-1,NaN,Infinity,1.5,9000])assert.equal(photoDimensionsAllowed(v,100),false);
});
test("bounded header reader handles PNG, JPEG and WebP and fails closed on truncated images",()=>{
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,15,160,0,0,11,184]);
 assert.deepEqual(encodedPhotoDimensions(png),{width:4000,height:3000});
 const jpg=Uint8Array.from([255,216,255,192,0,11,8,0,200,1,44,1,1,17,0]);
 assert.deepEqual(encodedPhotoDimensions(jpg),{width:300,height:200});
 const webp=new Uint8Array(30);webp.set(new TextEncoder().encode("RIFF"),0);webp.set(new TextEncoder().encode("WEBPVP8X"),8);webp[16]=10;webp[24]=99;webp[27]=49;
 assert.deepEqual(encodedPhotoDimensions(webp),{width:100,height:50});webp[20]=2;assert.equal(encodedPhotoDimensions(webp),null);
 for(let i=0;i<png.length;i++)assert.equal(encodedPhotoDimensions(png.slice(0,i)),null);
 assert.equal(encodedPhotoDimensions(jpg.slice(0,9)),null);
});

test("paint working surfaces adapt to low-memory devices without enlarging or changing aspect",()=>{
 assert.deepEqual(paintPreviewDimensions(1200,600),{width:1200,height:600});
 const lite=paintPreviewDimensions(4000,3000,{memory:2});
 assert.ok(lite.width*lite.height<=480000&&Math.max(lite.width,lite.height)<=896);
 assert.ok(Math.abs(lite.width/lite.height-4/3)<.01);
 assert.deepEqual(paintPreviewDimensions(420,280,{saveData:true}),{width:420,height:280});
 assert.throws(()=>paintPreviewDimensions(8000,8000));
});
