import test from "node:test";
import assert from "node:assert/strict";
import {validCombinedEstimate} from "./combined-estimate.ts";
const now=Date.parse("2026-11-26T00:00:00Z");
const good={seller:"Fixture only",material_paise:100000,fee_paise:1000,discount_paise:500,freight_paise:9000,unloading_paise:3000,tax_paise:0,estimated_total_paise:112500,valid_to:null};
test("consistent integer-paise estimate accepted",()=>{assert.equal(validCombinedEstimate(good,true,now),true);assert.equal(validCombinedEstimate({...good,unloading_paise:0,estimated_total_paise:109500},false,now),true)});
test("unknown, invalid and mismatched financial data fails closed",()=>{for(const row of [null,[],{}, {...good,freight_paise:null},{...good,estimated_total_paise:1},{...good,fee_paise:-1},{...good,material_paise:Infinity},{...good,tax_paise:0.1},{...good,discount_paise:100000},{...good,valid_to:"bad"},{...good,valid_to:"2026-01-01"}])assert.equal(validCombinedEstimate(row,true,now),false);assert.equal(validCombinedEstimate(good,false,now),false)});
