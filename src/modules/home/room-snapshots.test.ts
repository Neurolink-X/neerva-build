
import test from "node:test";
import assert from "node:assert/strict";
import {readSnapshots,maxSnapshots} from "./room-snapshots.ts";
import {defaultLab,addFurniture} from "./room-lab.ts";
test("saved alternatives remain independent and validated",()=>{const a=addFurniture(defaultLab,"bed"),b=addFurniture(defaultLab,"sofa");const items=readSnapshots(JSON.stringify([{id:"a",name:"A",room:a},{id:"b",name:"B",room:b},{id:"a",name:"duplicate",room:b}]));assert.equal(items.length,2);assert.equal(items[0].room.pieces[0].kind,"bed");assert.equal(items[1].room.pieces[0].kind,"sofa");assert.equal(readSnapshots("bad").length,0);assert.ok(readSnapshots(JSON.stringify(Array.from({length:10},(_,i)=>({id:"r"+i,name:"Room",room:a})))).length<=maxSnapshots)});
