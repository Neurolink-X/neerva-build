import assert from "node:assert/strict";
import test from "node:test";
import {activeDealerTenantIds} from "./dealer-tenant-access.ts";
test("dealer cannot access pending, suspended or closed merchants despite active membership",()=>{
 const rows=[{tenant_id:"a",active:true},{tenant_id:"b",active:true},{tenant_id:"c",active:true},{tenant_id:"d",active:false}];
 assert.deepEqual(activeDealerTenantIds(rows,[{id:"a",status:"pending"},{id:"b",status:"suspended"},{id:"c",status:"closed"},{id:"d",status:"active"}]),[]);
});
test("dealer can only read own currently approved active tenants and duplicates deduplicate",()=>{
 const memberships=[{tenant_id:"approved",active:true},{tenant_id:"approved",active:true},{tenant_id:"other",active:false}];
 assert.deepEqual(activeDealerTenantIds(memberships,[{id:"approved",status:"active"},{id:"other",status:"active"}]),["approved"]);
});
