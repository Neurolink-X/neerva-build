import test from "node:test";
import assert from "node:assert/strict";
import {stockConfirmationEnabled,stockConfirmationInput,stockFailure} from "./stock-confirmation.ts";
const id="11111111-1111-4111-8111-111111111111";
test("stock confirmation is opt-in, requires explicit SKU mapping and never trusts browser quantities",()=>{
 const v={orderId:id,branchId:id,variantIds:[id,id],exactSkuConfirmed:true};
 assert.ok(stockConfirmationInput.safeParse(v).success);
 for(const x of [{...v,quantity:1},{...v,exactSkuConfirmed:false},{...v,variantIds:[]},{...v,variantIds:Array(31).fill(id)}])assert.equal(stockConfirmationInput.safeParse(x).success,false);
 assert.equal(stockConfirmationEnabled({}),false);assert.equal(stockConfirmationEnabled({NEERVA_ATOMIC_STOCK_CONFIRMATION:"true"}),true);
 assert.equal(stockFailure("42501").status,403);assert.equal(stockFailure("23514").status,409);assert.equal(stockFailure("PGRST202").status,503);
});
