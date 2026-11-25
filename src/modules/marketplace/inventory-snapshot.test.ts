import test from "node:test";
import assert from "node:assert/strict";
import {inventoryWrite} from "./write-contract.ts";
const id="11111111-1111-4111-8111-111111111111";
const row={branchId:id,variantId:id,quantity:1.125,unit:"bag"};
test("inventory preserves decimal precision and validates optional optimistic snapshot",()=>{
 assert.ok(inventoryWrite.safeParse({...row,expectedUpdatedAt:null}).success);
 assert.ok(inventoryWrite.safeParse({...row,expectedUpdatedAt:"2026-11-25T05:00:00.123456+00:00"}).success);
 assert.equal(inventoryWrite.safeParse({...row,expectedUpdatedAt:"stale"}).success,false);
 assert.equal(inventoryWrite.safeParse({...row,quantity:1.1234}).success,false);
});
