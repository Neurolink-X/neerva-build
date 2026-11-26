import test from "node:test";
import assert from "node:assert/strict";
import {invalidatePublicFeeds,loadPublicFeed} from "./public-feed-client.ts";
test("catalog consumers share network reads and never reuse a superseded result",async()=>{
 const original=globalThis.fetch;let calls=0;let finish:(r:Response)=>void=()=>{};
 try{
  invalidatePublicFeeds();
  globalThis.fetch=async()=>{calls++;return new Promise<Response>(resolve=>{finish=resolve})};
  const first=loadPublicFeed("prices"),second=loadPublicFeed("prices");assert.equal(first,second);assert.equal(calls,1);
  finish(Response.json({prices:[{paise:100}]}));assert.deepEqual(await first,{prices:[{paise:100}]});
  assert.deepEqual(await loadPublicFeed("prices"),{prices:[{paise:100}]});assert.equal(calls,1);
  invalidatePublicFeeds();
  const outdated=loadPublicFeed("prices");const rejected=assert.rejects(outdated,/revised/);const resolveOld=finish;
  invalidatePublicFeeds();const fresh=loadPublicFeed("prices");
  resolveOld(Response.json({prices:[{paise:100}]}));await rejected;
  finish(Response.json({prices:[{paise:200}]}));assert.deepEqual(await fresh,{prices:[{paise:200}]});assert.equal(calls,3);
  globalThis.fetch=async()=>{calls++;return new Response("",{status:503})};
  await assert.rejects(loadPublicFeed("offers"),/unavailable/);await assert.rejects(loadPublicFeed("offers"),/unavailable/);assert.equal(calls,5);
 }finally{globalThis.fetch=original;invalidatePublicFeeds()}
});
