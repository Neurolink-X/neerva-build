import test from "node:test";
import assert from "node:assert/strict";
import {joinSourcingQueue,validSourcingChange} from "./admin-sourcing.ts";
const id="11111111-1111-4111-8111-111111111111";
test("admin national sourcing is a human-review case, never a confirmed order or price",()=>{
 const req={id,category_slug:"steel",material_description:"12mm TMT",quantity:100,unit:"kg",city:"Delhi",pincode:"110001",status:"open",created_at:"2026-11-23T12:00:00Z"};
 const cases=[{id:"22222222-2222-4222-8222-222222222222",quote_request_id:id,status:"checking_suppliers" as const,scope:"national" as const,note:"",updated_at:"2026-11-23T12:00:00Z"}];
 const [x]=joinSourcingQueue([req],cases,new Map());
 assert.equal(x.scope,"national");assert.equal(x.invitationCount,0);assert.equal(x.humanReviewRequired,true);
 assert.ok(!("total" in x)&&!("paid" in x)&&!("order" in x));
});
test("admin status transition input is allowlisted; cannot forge operator, user or fulfilment",()=>{
 const good={caseId:id,status:"checking_suppliers",scope:"national",note:"Manual sourcing only"};
 assert.deepEqual(validSourcingChange(good),good);
 for(const val of [{...good,orderStatus:"delivered"},{...good,status:"fulfilled"},{...good,note:"x".repeat(601)}, {...good,caseId:"../../etc"}])
  assert.equal(validSourcingChange(val),null);
});
