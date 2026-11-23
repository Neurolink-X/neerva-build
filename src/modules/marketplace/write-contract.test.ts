import test from "node:test";
import assert from "node:assert/strict";
import {catalogCommand,catalogUpdate,inventoryWrite,offerWrite,calculateOffer} from "./write-contract.ts";
const id="11111111-1111-4111-8111-111111111111";
const otherId="22222222-2222-4222-8222-222222222222";
test("catalog intake is draft-only; no unreviewed admin product publishes itself",()=>{
 assert.equal(catalogCommand.safeParse({kind:"category",action:"create",slug:"cement",nameEn:"Cement",nameHi:"सीमेंट",pricingMode:"public"}).success,true);
 assert.equal(catalogCommand.safeParse({kind:"brand",action:"create",slug:"acc",name:"ACC",status:"published"}).success,false);
 assert.equal(catalogCommand.safeParse({kind:"product",action:"create",slug:"cement-ppc-50-kg",categoryId:id,name:"PPC bag",description:"Sample",attributes:{grade:"PPC"}}).success,true);
 assert.equal(catalogCommand.safeParse({kind:"product",action:"create",slug:"bad/path",categoryId:id,name:"PPC bag",description:"Sample"}).success,false);
 assert.equal(catalogUpdate.safeParse({kind:"product",id,status:"published"}).success,true);
 assert.equal(catalogUpdate.safeParse({kind:"product",id,status:"published",tenantId:otherId}).success,false);
});
test("dealer stock rejects negative values, unknown units and other fields",()=>{
 assert.equal(inventoryWrite.safeParse({branchId:id,variantId:otherId,quantity:12,unit:"bag"}).success,true);
 assert.equal(inventoryWrite.safeParse({branchId:id,variantId:otherId,quantity:-5,unit:"bag"}).success,false);
 assert.equal(inventoryWrite.safeParse({branchId:id,variantId:otherId,quantity:6,unit:"fake-box"}).success,false);
 assert.equal(inventoryWrite.safeParse({branchId:id,variantId:otherId,quantity:6,unit:"bag",tenantId:otherId}).success,false);
});
const valid={
 quoteRequestId:id,tenantId:otherId,
 lines:[{description:"Cement PPC 50 kg",quantity:2,unit:"bag",unitPricePaise:35_100},
        {description:"Steel 12 mm",quantity:1.5,unit:"kg",unitPricePaise:6_345}],
 taxPaise:3_000,freightPaise:1_500,unloadingPaise:600,
 validUntil:new Date(Date.now()+86400_000).toISOString(),
 terms:"Dealer supply subject to acceptance and written dispatch confirmation."
};
test("offer uses paise integer sums; no client-provided total accepted",()=>{
 const parsed=offerWrite.parse(valid);
 const amounts=calculateOffer(parsed);
 assert.equal(amounts.subtotalPaise,35_100*2+Math.round(6_345*1.5));
 assert.equal(amounts.totalPaise,amounts.subtotalPaise+3_000+1_500+600);
 assert.equal(offerWrite.safeParse({...valid,totalPaise:1}).success,false);
 assert.equal(offerWrite.safeParse({...valid,freightPaise:-2}).success,false);
 assert.equal(offerWrite.safeParse({...valid,lines:[]}).success,false);
 assert.equal(offerWrite.safeParse({...valid,validUntil:new Date(Date.now()-100_000).toISOString()}).success,false);
});
