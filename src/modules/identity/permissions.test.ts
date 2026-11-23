import assert from "node:assert/strict";
import test from "node:test";
import {hasPermission,type PlatformRole} from "./permissions.ts";
const roles:PlatformRole[]=["customer","contractor","dealer","dealer_staff","design_professional","support","finance","admin","super_admin"];

test("customers can request quotes but cannot respond for a dealer",()=>{
 assert.equal(hasPermission("customer","quote:create"),true);
 assert.equal(hasPermission("customer","quote:respond"),false);
 assert.equal(hasPermission("customer","platform:manage"),false);
});
test("dealer can manage own inventory but cannot administer platform",()=>{
 assert.equal(hasPermission("dealer","inventory:manage_own"),true);
 assert.equal(hasPermission("dealer","platform:manage"),false);
 assert.equal(hasPermission("dealer_staff","pricing:manage_own"),false);
});
test("admin role is only role granted platform administration",()=>{
 for(const role of roles)assert.equal(hasPermission(role,"platform:manage"),role==="admin"||role==="super_admin");
});
test("support and finance access remain separated",()=>{
 assert.equal(hasPermission("support","finance:read"),false);
 assert.equal(hasPermission("finance","support:read"),false);
});
