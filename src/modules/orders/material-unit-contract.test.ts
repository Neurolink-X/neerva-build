import test from "node:test";
import assert from "node:assert/strict";
import {categoryUnits,defaultProductUnit,initialMaterialQuantity,quantityIncrement,validProductQuantity,validUnitQuantity,productUnits} from "../catalog/category-units.ts";
import {safeDirectCart,addDirectCart,changeDirectCartQuantity,cartKey} from "./direct-cart.ts";
import {directLine} from "./direct-contract.ts";
import {safeCheckoutReturn} from "./checkout-return.ts";
import {demoProducts} from "../catalog/marketplace.ts";

const brick={category:"bricks-blocks",productSlug:"red-clay-brick",productName:"Red clay brick",unit:"piece",quantity:100};
test("brick defaults, bulk increments and manually entered whole quantities",()=>{
 assert.equal(defaultProductUnit(brick.category,brick.productSlug),"piece");
 assert.deepEqual(productUnits(brick.category,brick.productSlug),["piece","bundle","truck"]);
 assert.equal(initialMaterialQuantity(brick.category,brick.productSlug,"piece"),100);
 assert.equal(quantityIncrement(brick.category,"aac-block-600x200","piece"),10);
 assert.ok(validProductQuantity(brick.category,brick.productSlug,"piece",750));
 for(const unit of ["bag","kg","tonne","litre"])assert.equal(validProductQuantity(brick.category,brick.productSlug,unit,100),false);
 assert.equal(validProductQuantity(brick.category,brick.productSlug,"piece",1.5),false);
});
test("wrong units cannot survive cart sanitation, mutation or direct order validation",()=>{
 assert.deepEqual(safeDirectCart([{...brick,unit:"bag"},{...brick,quantity:1.5}]),[]);
 assert.deepEqual(addDirectCart([brick],{...brick,unit:"kg"}),[brick]);
 assert.equal(changeDirectCartQuantity([brick],cartKey(brick),750)[0].quantity,750);
 assert.equal(changeDirectCartQuantity([brick],cartKey(brick),2.5)[0].quantity,100);
 const {productName:_,...line}=brick;
 assert.equal(directLine.safeParse(line).success,true);
 assert.equal(directLine.safeParse({...line,unit:"bag"}).success,false);
 assert.equal(directLine.safeParse({...line,quantity:1.5}).success,false);
 assert.equal(safeCheckoutReturn("/checkout?category=bricks-blocks&product=red-clay-brick&unit=bag&qty=5"),"/checkout?category=bricks-blocks&product=red-clay-brick");
});
test("fittings and conduit are not sold in pipe length or wire coils respectively",()=>{
 assert.equal(defaultProductUnit("plumbing","generic-pvc-elbow90"),"piece");
 assert.equal(validProductQuantity("plumbing","generic-pvc-elbow90","length",5),false);
 assert.equal(defaultProductUnit("electrical","generic-junction-box"),"piece");
 assert.equal(defaultProductUnit("electrical","generic-conduit"),"metre");
 assert.equal(validProductQuantity("electrical","generic-conduit","coil",1),false);
});
test("all public reference products have a category-compatible default and a valid initial quantity",()=>{
 assert.ok(demoProducts.length>300);
 for(const p of demoProducts){const unit=defaultProductUnit(p.category,p.slug);assert.ok(categoryUnits(p.category).includes(unit),p.slug);assert.ok(validProductQuantity(p.category,p.slug,unit,initialMaterialQuantity(p.category,p.slug,unit)),p.slug);}
 for(const unit of ["bag","piece","box","coil","truck"])assert.equal(validUnitQuantity(unit,1.5),false,unit);
 for(const unit of ["kg","tonne","metre","litre","square_foot","cubic_metre"])assert.equal(validUnitQuantity(unit,1.125),true,unit);
});
