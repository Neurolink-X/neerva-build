import test from "node:test";
import assert from "node:assert/strict";
import {cleanQuotePrefill} from "./quote-prefill.ts";
test("valid single-material request transfers only draft inputs; no phantom order",()=>{
 assert.deepEqual(cleanQuotePrefill({city:"Kanpur",material:"  UltraTech PPC cement 50 kg ",quantity:"15",pincode:"208001"}),
 {city:"Kanpur",material:"UltraTech PPC cement 50 kg",quantity:"15",pincode:"208001"});
});
test("untrusted prefill cannot forge pincode, city, invalid amount or control chars",()=>{
 assert.deepEqual(cleanQuotePrefill({city:"<html>",material:"  \u0000TMT   ",quantity:"-25",pincode:"000000"}),
 {city:"Kanpur",material:"TMT",quantity:"",pincode:""});
 assert.equal(cleanQuotePrefill({quantity:"Infinity"}).quantity,"");
});
