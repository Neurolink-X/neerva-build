import test from "node:test";
import assert from "node:assert/strict";
import {studioProducts,studioPayee,isStudioProduct,studioPaymentEnabled,studioUpiUrl} from "./paid-products.ts";
test("both paid studio products cost INR 149 with no subscription pricing",()=>{
 for(const key of ["home_studio","colour_studio"] as const){
  assert.equal(studioProducts[key].pricePaise,14900);
  assert.equal(isStudioProduct(key),true);
 }
 assert.equal(isStudioProduct("admin"),false);
 assert.equal(isStudioProduct("__proto__"),false);
});
test("manual UPI flow fails closed until both operator and payment flags verified",()=>{
 const safe={NEERVA_STUDIO_PAYMENTS_ENABLED:"true",NEERVA_OPERATOR_TERMS_VERIFIED:"true"};
 assert.equal(studioPaymentEnabled(safe),true);
 assert.equal(studioPaymentEnabled({...safe,NEERVA_OPERATOR_TERMS_VERIFIED:"false"}),false);
 assert.equal(studioPaymentEnabled({...safe,NEERVA_STUDIO_PAYMENTS_ENABLED:"false"}),false);
 assert.equal(studioPaymentEnabled({}),false);
});
test("UPI intent fills exact beneficiary, INR 149 and selected service without claiming settlement",()=>{
 for(const product of ["home_studio","colour_studio"] as const){
  const link=studioUpiUrl(product,"12345678-bbbb-4444-aaaa-123456789000");
  assert.ok(link.startsWith("upi://pay?"));
  const params=new URLSearchParams(link.split("?")[1]);
  assert.equal(params.get("pa"),studioPayee.id);
  assert.equal(params.get("pn"),"ARJUN CHAURASIYA");
  assert.equal(params.get("am"),"149.00");
  assert.equal(params.get("cu"),"INR");
  assert.ok(params.get("tn")?.includes(product==="home_studio"?"Home Studio":"Colour Studio"));
  assert.equal(params.get("tr"),null,"do not invent a verified payment processor reference");
  const discounted=studioUpiUrl(product,"12345678-bbbb-4444-aaaa-123456789000",9900);
  const d=new URLSearchParams(discounted.split("?")[1]);
  assert.equal(d.get("am"),"99.00","admin-set price must fill exact UPI order amount");
  assert.ok(d.get("tn")?.includes("INR99.00"),"service note must match actual order amount");
  assert.throws(()=>studioUpiUrl(product,"id",-1),/INVALID_STUDIO_PRICE/);
 }
});
