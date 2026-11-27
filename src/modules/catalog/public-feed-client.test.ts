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

test("catalog invalidation cancels superseded transport and permits a fresh request",async()=>{
 const original=globalThis.fetch;let calls=0;let firstSignal:AbortSignal|undefined;
 try{
  invalidatePublicFeeds();globalThis.fetch=async(_input,init)=>{calls++;if(calls===1){firstSignal=init?.signal??undefined;return new Promise<Response>((_resolve,reject)=>{firstSignal?.addEventListener("abort",()=>reject(new DOMException("Aborted","AbortError")),{once:true})})}return Response.json({prices:[{paise:200}]});};
  const pending=loadPublicFeed("prices");const rejected=assert.rejects(pending,/revised/);invalidatePublicFeeds();await rejected;assert.equal(firstSignal?.aborted,true);
  assert.deepEqual(await loadPublicFeed("prices"),{prices:[{paise:200}]});assert.equal(calls,2);
 }finally{globalThis.fetch=original;invalidatePublicFeeds()}
});

test("price pages merge in price order; interrupted or cyclic pagination never publishes partial rates",async()=>{
 const original=globalThis.fetch,first="00000000-0000-0000-0000-000000000001";let calls=0;
 try{
  invalidatePublicFeeds();
  globalThis.fetch=async(input)=>{calls++;const after=new URL(String(input),"https://test.invalid").searchParams.get("after");return after?Response.json({prices:[{paise:100}],nextCursor:null}):Response.json({prices:[{paise:300}],nextCursor:first})};
  assert.deepEqual(await loadPublicFeed("prices"),{prices:[{paise:100},{paise:300}]});assert.equal(calls,2);
  invalidatePublicFeeds();globalThis.fetch=async(input)=>new URL(String(input),"https://test.invalid").searchParams.has("after")?new Response("",{status:503}):Response.json({prices:[{paise:300}],nextCursor:first});
  await assert.rejects(loadPublicFeed("prices"),/unavailable/);
  globalThis.fetch=async()=>Response.json({prices:[{paise:300}],nextCursor:first});
  await assert.rejects(loadPublicFeed("prices"),/cursor/);
  globalThis.fetch=async()=>Response.json({prices:[],nextCursor:null});assert.deepEqual(await loadPublicFeed("prices"),{prices:[]});
 }finally{globalThis.fetch=original;invalidatePublicFeeds()}
});

test("category reads deduplicate only identical scopes and never share other categories",async()=>{
 const original=globalThis.fetch;const calls:string[]=[];
 try{
  invalidatePublicFeeds();globalThis.fetch=async input=>{const category=new URL(String(input),"https://test.invalid").searchParams.get("category")??"all";calls.push(category);return Response.json({prices:[{category,paise:100}]});};
  const a=loadPublicFeed("prices","cement");assert.equal(a,loadPublicFeed("prices","cement"));
  const b=loadPublicFeed("prices","steel");assert.notEqual(a,b);
  assert.deepEqual(await a,{prices:[{category:"cement",paise:100}]});
  assert.deepEqual(await b,{prices:[{category:"steel",paise:100}]});
  await loadPublicFeed("prices");assert.deepEqual(calls,["cement","steel","all"]);
 }finally{globalThis.fetch=original;invalidatePublicFeeds()}
});

test("a scoped feed rejects leaked cross-category rows",async()=>{const original=globalThis.fetch;try{invalidatePublicFeeds();globalThis.fetch=async()=>Response.json({prices:[{category:"steel",paise:100}]});await assert.rejects(loadPublicFeed("prices","cement"),/another category/)}finally{globalThis.fetch=original;invalidatePublicFeeds()}});
