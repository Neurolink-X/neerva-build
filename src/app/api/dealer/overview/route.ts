import {apiData,apiFailed,requireDealer} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 try{const [members,branches,orders,invites,offers]=await Promise.all([
 auth.client.from("tenant_memberships").select("tenant_id,role,tenants(business_name,status)").eq("user_id",auth.userId).in("tenant_id",auth.tenantIds).eq("active",true),
 auth.client.from("merchant_branches").select("id,name,city,pincode,tenant_id").in("tenant_id",auth.tenantIds).eq("approved",true),
 auth.client.from("orders").select("id",{count:"exact",head:true}).in("tenant_id",auth.tenantIds),
 auth.client.from("quote_invites").select("quote_request_id",{count:"exact",head:true}).in("tenant_id",auth.tenantIds).in("status",["invited","viewed"]),
 auth.client.from("quote_offers").select("id",{count:"exact",head:true}).in("tenant_id",auth.tenantIds)]);
 if(members.error||branches.error)return apiFailed();
 const ids=(branches.data??[]).map(b=>b.id);const stock=ids.length?await auth.client.from("inventory").select("variant_id",{count:"exact",head:true}).in("branch_id",ids):{count:0,error:null};
 return apiData({memberships:members.data??[],branches:branches.data??[],counts:{orders:orders.error?null:orders.count,invites:invites.error?null:invites.count,offers:offers.error?null:offers.count,stock:stock.error?null:stock.count}});
 }catch{return apiFailed()}
}
