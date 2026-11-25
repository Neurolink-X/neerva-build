import test from "node:test";
import assert from "node:assert/strict";
import {validPublicRate,validPublicOffer} from "./public-feed-validation.ts";
import {parsePublishedCatalogPage} from "./published-page.ts";
const now=Date.parse("2026-11-25T04:00:00Z"),future="2026-11-25T05:00:00Z";
const rate={category:"cement",slug:"opc-53",sku:"C-1",unit:"bag",city:"Kanpur",prefix:null,min:1,paise:40000,until:future};
const offer={...rate,id:"campaign",title:"Verified offer",terms:"Dealer confirmation",basePaise:40000,offerPaise:38000,endsAt:future};
test("valid rates and promotions accept real positive integer paise",()=>{
 assert(validPublicRate(rate,now));assert(validPublicRate({...rate,until:null},now));assert(validPublicOffer(offer,now));
});
test("malformed rows cannot poison a price feed",()=>{
 for(const row of [null,[],{}, {...rate,paise:Infinity},{...rate,paise:1.2},{...rate,paise:"40000"},{...rate,sku:""},{...rate,unit:"invalid"},{...rate,min:0},{...rate,prefix:"abc"},{...rate,category:"aggregates"},{...rate,until:""}])assert.equal(validPublicRate(row,now),false);
});
test("expired and fabricated promotions are rejected",()=>{
 for(const row of [null,{...offer,endsAt:new Date(now).toISOString()},{...offer,endsAt:"invalid"},{...offer,offerPaise:40000},{...offer,offerPaise:1.5},{...offer,basePaise:Infinity},{...offer,title:""},{...offer,terms:null}])assert.equal(validPublicOffer(row,now),false);
 assert.equal(validPublicRate(rate,Date.parse(future)),false);
});
test("ambiguous repeated pagination parameters are rejected",()=>{
 for(const query of ["limit=24&limit=100","after=first&after=second","category=cement&category=steel"])assert.equal(parsePublishedCatalogPage(new URLSearchParams(query)),null);
 assert.deepEqual(parsePublishedCatalogPage(new URLSearchParams("limit=24&category=cement")),{limit:24,after:null,category:"cement"});
});
