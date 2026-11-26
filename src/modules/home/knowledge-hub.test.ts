import test from "node:test";
import assert from "node:assert/strict";
import {knowledgePaths,knowledgeSources} from "./knowledge-hub.ts";
test("every practical knowledge guide has a unique id, action, warning and authoritative reference",()=>{const guides=knowledgePaths.flatMap(p=>[...p.guides]);assert.ok(guides.length>=14);assert.equal(new Set(guides.map(g=>g.id)).size,guides.length);for(const g of guides){assert.ok(g.example.length>35&&g.steps.length>45&&g.practice.length>30&&g.warning.length>20);assert.ok(g.href.startsWith("/"));assert.ok(knowledgeSources[g.source].url.startsWith("https://"));assert.ok(g.hi.length>0);}});

test("space lessons distinguish Mars experiment, Earth demonstrations and future proposals",()=>{const space=knowledgePaths.find(p=>p.id==="space");assert.ok(space);assert.equal(space.guides.length,5);assert.match(space.intro,/No crewed Mars building/);assert.match(space.guides.find(g=>g.id==="moxie-isru")!.example,/Actual Mars experiment/);assert.match(space.guides.find(g=>g.id==="mars-habitat")!.example,/Earth demonstration/);assert.match(space.guides.find(g=>g.id==="off-earth-systems")!.example,/Proposed engineering sequence/);});
