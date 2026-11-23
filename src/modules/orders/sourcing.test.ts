import test from "node:test";
import assert from "node:assert/strict";
import {attachSourcingStatus,sourcingStatus,noDealerOrderRouting,type RfqRow} from "./sourcing.ts";
const a:RfqRow={id:"real-request-id",status:"open",category_slug:"cement",material_description:"PPC cement",quantity:50,unit:"bag",city:"Jaipur",pincode:"302001",created_at:"2026-11-23T00:00:00Z"};
test("unmatched verified RFQ remains visible to admin sourcing from any Indian city",()=>{
 const cases=attachSourcingStatus([a],[],[]);
 assert.equal(cases.length,1);
 assert.equal(cases[0].sourcing_status,"admin_sourcing_needed");
 assert.equal(cases[0].fulfilment_status,"unconfirmed");
 assert.equal(cases[0].city,"Jaipur");
});
test("dealer invites and real offers determine routing without inventing orders",()=>{
 assert.equal(sourcingStatus(a,[{quote_request_id:a.id,status:"invited"}],[]),"dealer_reply_pending");
 assert.equal(sourcingStatus(a,[],[{quote_request_id:a.id}]),"offers_received");
 assert.equal(sourcingStatus({...a,status:"cancelled"},[],[]),"resolved");
 assert.equal(sourcingStatus(a,[{quote_request_id:"other",status:"invited"}],[]),"admin_sourcing_needed");
});
test("admin-order fallback requires persisted order and cannot invent delivery guarantees",()=>{
 assert.equal(noDealerOrderRouting({orderPersisted:false,eligibleVerifiedDealerCount:0,country:"IN"}),"needs_order_backend");
 assert.equal(noDealerOrderRouting({orderPersisted:true,eligibleVerifiedDealerCount:0,country:"IN"}),"admin_manual_sourcing");
 assert.equal(noDealerOrderRouting({orderPersisted:true,eligibleVerifiedDealerCount:3,country:"IN"}),"dealer_dispatch_ready");
 assert.equal(noDealerOrderRouting({orderPersisted:true,eligibleVerifiedDealerCount:-1,country:"IN"}),"needs_order_backend");
});
