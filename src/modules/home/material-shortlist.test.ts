import test from "node:test";
import assert from "node:assert/strict";
import {readShortlist,emptyShortlist,visitMaterial,toggleSavedMaterial,materialHref} from "./material-shortlist.ts";
import {stageHandbook,journeyLinks} from "./journey-links.ts";
import {stages} from "./project-planner.ts";
import {chapters} from "./handbook.ts";
const brick={category:"bricks-blocks",slug:"red-clay-brick",name:"Red clay brick"};
test("saved and recent material history is bounded, deduplicated, opt-out aware",()=>{
 let s=toggleSavedMaterial(emptyShortlist,brick);
 assert.equal(s.saved.length,1);assert.equal(toggleSavedMaterial(s,brick).saved.length,0);
 s=visitMaterial(visitMaterial(s,brick),brick);assert.equal(s.recent.length,1);
 for(let i=0;i<40;i++){const p={...brick,slug:"brick-"+i};s=visitMaterial(toggleSavedMaterial(s,p),p)}
 assert.equal(s.recent.length,8);assert.equal(s.saved.length,30);
 assert.equal(visitMaterial({...emptyShortlist,historyEnabled:false},brick).recent.length,0);
 assert.equal(readShortlist(JSON.stringify({...s,historyEnabled:false})).recent.length,0);
});
test("malformed saved links are rejected; no external navigation",()=>{
 const bad={...brick,slug:"../admin"};assert.equal(materialHref(bad),"/materials");
 assert.deepEqual(readShortlist(JSON.stringify({saved:[bad,brick,brick]})).saved,[brick]);
 assert.deepEqual(readShortlist("broken"),emptyShortlist);
});
test("every construction stage links to existing handbook content",()=>{
 for(const s of stages){assert.ok(stageHandbook[s.id].length);for(const id of stageHandbook[s.id])assert.ok(chapters.some(c=>c.id===id),id)}
 assert.equal(new Set(journeyLinks.map(x=>x.href)).size,journeyLinks.length);
});
