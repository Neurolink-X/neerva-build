/* Disposable CI only. Never provision fixture accounts on a hosted Supabase project. */
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {appendFileSync} from "node:fs";
import {createClient} from "@supabase/supabase-js";
const origin=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(process.env.CI,"true");assert.equal(process.env.QA_LOCAL_DISPOSABLE,"true");
assert.equal(origin,"http://127.0.0.1:54321");
const key=process.env.QA_LOCAL_SERVICE_ROLE_KEY;
assert.ok(key&&process.env.GITHUB_ENV,"Local fixture configuration required");
const client=createClient(origin,key,{auth:{persistSession:false,autoRefreshToken:false}});
const ids={},env=[];
for(const role of ["ADMIN","CUSTOMER","DEALER"]){
 const email="qa-"+role.toLowerCase()+"@example.test",password=randomBytes(24).toString("hex");
 console.log("::add-mask::"+password);
 const {data,error}=await client.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:"QA "+role}});
 assert.ok(!error&&data.user,"Unable to create local "+role+" fixture: "+(error?.code??"unknown"));
 ids[role]=data.user.id;env.push("QA_"+role+"_EMAIL="+email,"QA_"+role+"_PASSWORD="+password);
}
async function insert(table,value){const {data,error}=await client.from(table).insert(value).select().single();assert.ok(!error&&data,"Fixture "+table+" failed: "+(error?.code??"unknown"));return data}
await insert("platform_role_grants",{user_id:ids.ADMIN,role:"super_admin"});
await insert("platform_role_grants",{user_id:ids.CUSTOMER,role:"customer"});
const tenant=await insert("tenants",{business_name:"QA isolated dealer",status:"active"});
await insert("tenant_memberships",{tenant_id:tenant.id,user_id:ids.DEALER,role:"owner",active:true});
await insert("merchant_branches",{tenant_id:tenant.id,name:"QA isolated branch",city:"Kanpur",pincode:"208001",approved:true});
appendFileSync(process.env.GITHUB_ENV,env.join("\n")+"\n");
console.log("Three local verified accounts and isolated dealer fixture created.");
