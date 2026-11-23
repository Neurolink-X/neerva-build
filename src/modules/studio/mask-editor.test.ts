import test from "node:test";
import assert from "node:assert/strict";
import {addCorner,emptyMaskHistory,polygonArea,redoCorner,undoCorner,validWallMask} from "./mask-editor.ts";
const quad=[{x:.1,y:.1},{x:.9,y:.1},{x:.9,y:.9},{x:.1,y:.9}];
test("photo wall mask preserves area and rejects crossed or tiny polygons",()=>{
 assert.equal(Number(polygonArea(quad).toFixed(3)),.64);
 assert.equal(validWallMask(quad),true);
 assert.equal(validWallMask([quad[0],quad[2],quad[1],quad[3]]),false);
 assert.equal(validWallMask([{x:.1,y:.1},{x:.11,y:.1},{x:.11,y:.11},{x:.1,y:.11}]),false);
 assert.equal(validWallMask([{x:-.1,y:.2},...quad.slice(1)]),false);
});
test("undo, redo and new selection clear redo history",()=>{
 let s=emptyMaskHistory();
 for(const p of quad)s=addCorner(s,p);
 assert.equal(s.points.length,4);
 assert.equal(addCorner(s,{x:.5,y:.5}).points.length,4);
 s=undoCorner(s);assert.equal(s.points.length,3);assert.equal(s.redo.length,1);
 s=redoCorner(s);assert.equal(s.points.length,4);assert.equal(s.redo.length,0);
 s=undoCorner(s);s=addCorner(s,{x:.2,y:.8});assert.equal(s.redo.length,0);
 assert.equal(validWallMask(s.points),true);
});
