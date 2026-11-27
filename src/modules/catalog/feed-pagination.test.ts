import test from "node:test";
import assert from "node:assert/strict";
import {parseFeedPage,takeFeedPage,catalogFeedScope,parseFeedCategory} from "./feed-pagination.ts";
test("feed pages preserve legacy callers and reject malformed or excessive input",()=>{
 assert.deepEqual(parseFeedPage(new URLSearchParams()),{limit:1000,after:null,paginated:false});
 const id="00000000-0000-0000-0000-000000000001";
 assert.deepEqual(parseFeedPage(new URLSearchParams({limit:"250",after:id})),{limit:250,after:id,paginated:true});
 for(const q of ["limit=251","limit=0","limit=1&limit=2","after="+id,"limit=5&after=invalid","limit=5&after="+id+"&after="+id])assert.equal(parseFeedPage(new URLSearchParams(q)),null);
 const rows=[{id:"1"},{id:"2"},{id:"3"}];
 assert.deepEqual(takeFeedPage(rows,2),{rows:rows.slice(0,2),nextCursor:"2"});
 assert.deepEqual(takeFeedPage(rows.slice(2),2),{rows:rows.slice(2),nextCursor:null});
});

test("category feeds accept only known scopes; mixed pages retain one shared feed",()=>{
 assert.equal(catalogFeedScope("/materials/cement"),"cement");
 assert.equal(catalogFeedScope("/materials/tiles/sku"),"tiles");
 assert.equal(catalogFeedScope("/materials"),undefined);
 assert.equal(catalogFeedScope("/brands/cement"),undefined);
 assert.equal(parseFeedCategory(new URLSearchParams("category=cement")),"cement");
 for(const q of ["category=","category=unknown","category=cement&category=steel"])assert.equal(parseFeedCategory(new URLSearchParams(q)),null);
 assert.equal(parseFeedCategory(new URLSearchParams()),undefined);
});
