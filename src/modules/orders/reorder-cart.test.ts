import test from "node:test";
import assert from "node:assert/strict";
import {addDirectCart,mergePreviousMaterials} from "./direct-cart.ts";
const brick={category:"bricks-blocks",productSlug:"red-clay-brick",productName:"Red clay brick",unit:"piece",quantity:100};
test("reorder merges quantities without order submission or historical pricing",()=>{
 const old=[brick];
 const next=mergePreviousMaterials(old,[{...brick,quantity:250,total_paise:1}]);
 assert.deepEqual(next,[{...brick,quantity:350}]);assert.deepEqual(old,[brick]);
});
test("invalid, quote-only and overflowing repeats cannot partially modify cart",()=>{
 const old=[{...brick,quantity:999950}];
 assert.equal(mergePreviousMaterials(old,[brick]),null);
 assert.equal(mergePreviousMaterials([], [brick,{...brick,unit:"bag"}]),null);
 assert.equal(mergePreviousMaterials([],[{...brick,category:"aggregates",unit:"tonne"}]),null);
 assert.equal(mergePreviousMaterials([],[brick,brick]),null);
 const full=Array.from({length:25},(_,i)=>({...brick,productSlug:"brick-"+i}));
 assert.equal(mergePreviousMaterials(full,[brick]),null);
});

test("cart additions are atomic at the quantity limit, never silently clipped",()=>{
 const old=[{...brick,quantity:999950}];
 assert.deepEqual(addDirectCart(old,brick),old);
 assert.deepEqual(addDirectCart(old,{...brick,quantity:50}),[{...brick,quantity:1000000}]);
 assert.deepEqual(addDirectCart(old,{...brick,quantity:.5}),old);
 assert.equal(old[0].quantity,999950);
});
