import {test} from "node:test";
import assert from "node:assert/strict";
import {parseAddress,parseSavedAddress} from "./saved-addresses.ts";
const valid={label:"Site 1",contact_name:"Test customer",phone:"9876543210",city:"Kanpur",pincode:"208001",delivery_address:"House 1, test street"};
test("address normalization does not accept owner or id from editable fields",()=>{
 assert.deepEqual(parseAddress({...valid,label:" Site 1 ",user_id:"other",id:"other"}),valid);
 for(const patch of [{pincode:"000000"},{phone:"1234567890"},{delivery_address:"short"},{city:""},{label:"x".repeat(41)},{contact_name:123}])assert.equal(parseAddress({...valid,...patch}),null);
});
test("invalid persisted records are rejected",()=>{
 assert.equal(parseSavedAddress({...valid,id:"bad"}),null);
 assert.deepEqual(parseSavedAddress({...valid,id:"12345678-1234-1234-1234-123456789abc"}),{...valid,id:"12345678-1234-1234-1234-123456789abc"});
});
