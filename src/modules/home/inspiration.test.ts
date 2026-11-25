import test from "node:test";
import assert from "node:assert/strict";
import {ideas,palettes,parseBoard,toggleIdea,boardQuery,boardFromQuery} from "./inspiration.ts";
test("inspiration catalog has unique stable IDs and local assets",()=>{assert.equal(new Set(ideas.map(i=>i.id)).size,ideas.length);assert.equal(new Set(ideas.map(i=>i.src)).size,ideas.length);assert.ok(ideas.every(i=>i.src.startsWith("/images/")&&i.href.startsWith("/")&&i.tip.length>0));assert.equal(new Set(palettes.map(p=>p.id)).size,palettes.length)});
test("board links round trip only allowlisted IDs and palettes",()=>{const b=parseBoard({ids:["starter","starter","<script>","family"],palette:"sage"});assert.deepEqual(b,{ids:["starter","family"],palette:"sage"});assert.deepEqual(boardFromQuery(boardQuery(b)),b);assert.deepEqual(toggleIdea(b,"starter").ids,["family"]);assert.deepEqual(toggleIdea(b,"unknown"),b);assert.equal(boardFromQuery(""),null);assert.equal(parseBoard({palette:"bad"}).palette,"warm")});
