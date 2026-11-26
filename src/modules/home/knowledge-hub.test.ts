import test from "node:test";
import assert from "node:assert/strict";
import {knowledgePaths,knowledgeSources} from "./knowledge-hub.ts";
test("every practical knowledge guide has a unique id, action, warning and authoritative reference",()=>{const guides=knowledgePaths.flatMap(p=>[...p.guides]);assert.ok(guides.length>=14);assert.equal(new Set(guides.map(g=>g.id)).size,guides.length);for(const g of guides){assert.ok(g.example.length>35&&g.steps.length>45&&g.practice.length>30&&g.warning.length>20);assert.ok(g.href.startsWith("/"));assert.ok(knowledgeSources[g.source].url.startsWith("https://"));assert.ok(g.hi.length>0);}});
