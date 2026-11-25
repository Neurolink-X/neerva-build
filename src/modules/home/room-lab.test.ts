import test from "node:test";
import assert from "node:assert/strict";
import {defaultLab,addFurniture,movePiece,parseLab,readLab,occupiedArea,fits} from "./room-lab.ts";
test("furniture fits, cannot overlap or leave the room, and rotates only when valid",()=>{let r=addFurniture(defaultLab,"bed");assert.equal(r.pieces.length,1);r=addFurniture(r,"sofa");assert.equal(r.pieces.length,2);assert.ok(r.pieces.every(p=>fits(r,p)));const p=r.pieces[1];assert.equal(movePiece(r,p.id,{x:-1}),r);assert.equal(movePiece(r,p.id,{x:r.pieces[0].x,y:r.pieces[0].y}),r);assert.equal(occupiedArea(r),53.5);assert.deepEqual(readLab(JSON.stringify(r)),r)});
test("corrupt, oversized or out-of-bounds storage falls back safely",()=>{assert.deepEqual(readLab("x".repeat(4097)),defaultLab);assert.equal(parseLab({width:12,depth:14,pieces:[{id:1,kind:"bed",x:11,y:13,rotated:false}]}).pieces.length,0)});
