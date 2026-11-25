import test from "node:test";
import assert from "node:assert/strict";
import {reconcileCatalog,type DatabaseIdentity} from "./reconciliation.ts";
const ref={slug:"cement-a",category:"cement",unit:"bag"};
const row:DatabaseIdentity={slug:ref.slug,category:ref.category,status:"draft",origin:"neerva-static-reference",variants:[{sku:"NEERVA-REF-cement-a",unit:"bag",status:"draft"}]};
test("catalog drift detects missing rows, unmanaged collisions and unsafe publication without modifying data",()=>{
 assert.deepEqual(reconcileCatalog([ref],[row]),[]);
 assert.deepEqual(reconcileCatalog([ref],[]),[{slug:ref.slug,kind:"missing"}]);
 assert.deepEqual(reconcileCatalog([ref],[{...row,origin:null}]),[{slug:ref.slug,kind:"unmanaged_collision"}]);
 assert.deepEqual(reconcileCatalog([ref],[{...row,status:"published",category:"steel",variants:[{...row.variants[0],unit:"kg"}]}]).map(x=>x.kind),["category_mismatch","reference_published","unit_mismatch"]);
 assert.deepEqual(reconcileCatalog([],[row]),[{slug:ref.slug,kind:"orphan_reference"}]);
});
