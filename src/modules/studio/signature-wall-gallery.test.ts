import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {signatureWallGallery} from "./signature-wall-gallery.ts";
import {encodedPhotoDimensions} from "./photo-budget.ts";
test("design-only gallery has eight distinct complete local artwork images, no paint state",()=>{
 assert.equal(signatureWallGallery.length,8);
 for(const key of ["id","src","sha256"] as const)assert.equal(new Set(signatureWallGallery.map(d=>d[key])).size,8);
 let total=0;
 for(const d of signatureWallGallery){assert.ok(!("pattern" in d)&&!("base" in d)&&!("accent" in d));const bytes=readFileSync(new URL("../../../public"+d.src,import.meta.url));assert.equal(bytes.length,d.bytes);assert.equal(createHash("sha256").update(bytes).digest("hex"),d.sha256);assert.deepEqual(encodedPhotoDimensions(bytes),{width:d.width,height:d.height});assert.ok(d.description.length>30);total+=d.bytes;}
 assert.ok(total<240000);assert.equal(signatureWallGallery.filter(d=>d.kind==="room concept").length,2);
});
