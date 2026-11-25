
import test from "node:test";import assert from "node:assert/strict";
import {materialAtlas,glossary,atlasEditorial} from "./material-atlas.ts";
import {chapters} from "./handbook.ts";import {lessons} from "./academy.ts";
test("material atlas has unique stable anchors, substantive reference fields and valid links",()=>{assert.equal(new Set(materialAtlas.map(m=>m.id)).size,materialAtlas.length);assert.equal(new Set(glossary.map(g=>g[0])).size,glossary.length);assert.ok(materialAtlas.length>=15&&glossary.length>=20);for(const m of materialAtlas){assert.match(m.id,/^[a-z-]+$/);assert.ok(m.science.length>50&&m.specification.length>20&&m.measurement.length>10&&m.mistake.length>20&&m.hindi.length>20);assert.ok(chapters.some(c=>c.id===m.chapter)&&lessons.some(l=>l.id===m.lesson));assert.ok(m.tool.startsWith("/"))}assert.ok(atlasEditorial.updated<atlasEditorial.reviewDue)});
