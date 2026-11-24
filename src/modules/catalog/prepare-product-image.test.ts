import test from "node:test";
import assert from "node:assert/strict";
import {fitImage,matchesImageType} from "./prepare-product-image.ts";
test("product images preserve aspect ratio and never upscale",()=>{
 assert.deepEqual(fitImage(4000,3000),{width:1600,height:1200});
 assert.deepEqual(fitImage(800,1200),{width:800,height:1200});
 assert.deepEqual(fitImage(1000,4000),{width:400,height:1600});
 assert.throws(()=>fitImage(10000,10000));
 assert.throws(()=>fitImage(0,1));
});
test("image signature checks reject spoofed and truncated data",()=>{
 assert.equal(matchesImageType(Uint8Array.from([255,216,255]),"image/jpeg"),true);
 assert.equal(matchesImageType(Uint8Array.from([137,80,78,71]),"image/png"),false);
 assert.equal(matchesImageType(Uint8Array.from([137,80,78,71,13,10,26,10]),"image/png"),true);
 assert.equal(matchesImageType(Uint8Array.from([255,216,255]),"image/webp"),false);
 assert.equal(matchesImageType(new TextEncoder().encode("RIFF0000WEBP"),"image/webp"),true);
});
