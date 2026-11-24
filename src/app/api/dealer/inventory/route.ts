import {apiData,apiFailed,requireDealer} from "@/modules/identity/server-auth";
import {inventoryWrite,errorFields} from "@/modules/marketplace/write-contract";
import {isAllowedCategoryUnit} from "@/modules/catalog/category-units";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
const err=(status:number,error:string,fields?:unknown)=>Response.json({error,...(fields?{fields}:{})},{status,headers});
export async function GET(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 try{const [a,b,c]=await Promise.all([
   auth.client.from("tenant_memberships").select("tenant_id,role,tenants(business_name,status)").in("tenant_id",auth.tenantIds).eq("user_id",auth.userId),
   auth.client.from("merchant_branches").select("id,tenant_id,name,city,pincode,approved").in("tenant_id",auth.tenantIds).eq("approved",true),
   auth.client.from("product_variants").select("id,sku,unit,product:products(id,slug,name,status,category:categories(slug,name_en,pricing_mode),brand:brands(name))").eq("status","published").limit(250)
 ]);
 if(a.error||b.error||c.error)return apiFailed();
 // Do not serve unrelated branch stock, including a dealer's unapproved branches.
 // Query after verifying approved branches rather than trusting row order/limit + RLS alone.
 const approvedBranchIds=(b.data??[]).map(row=>String(row.id));
 const d=approvedBranchIds.length
  ?await auth.client.from("inventory").select("branch_id,variant_id,available_quantity,unit,updated_at").in("branch_id",approvedBranchIds).limit(300)
  :{data:[],error:null};
 if(d.error)return apiFailed();
 return apiData({memberships:a.data??[],branches:b.data??[],variants:c.data??[],inventory:d.data??[]});
 }catch{return apiFailed()}
}
export async function POST(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 if(!request.headers.get("content-type")?.includes("application/json"))return err(415,"JSON required.");
 let raw:unknown;
 try{const value=await request.text();if(value.length>4096)return err(413,"Request too large.");raw=JSON.parse(value)}catch{return err(400,"Invalid JSON.");}
 const check=inventoryWrite.safeParse(raw);
 if(!check.success)return err(400,"Stock record is invalid.",errorFields(check.error));
 const value=check.data;
 try{
  const [branch,variant,membership]=await Promise.all([
   auth.client.from("merchant_branches").select("id,tenant_id,approved").eq("id",value.branchId).maybeSingle(),
   auth.client.from("product_variants").select("id,sku,unit,status,product:products(category:categories(slug),status)").eq("id",value.variantId).maybeSingle(),
   auth.client.from("tenant_memberships").select("tenant_id,role,active").eq("user_id",auth.userId).in("tenant_id",auth.tenantIds)
  ]);
  if(branch.error||variant.error||membership.error)return apiFailed();
  if(!branch.data?.approved||!auth.tenantIds.includes(String(branch.data.tenant_id)))return err(403,"Approved dealer branch required.");
  const branchTenant=String(branch.data.tenant_id);
  if(!(membership.data??[]).some(x=>x.tenant_id===branchTenant&&x.active&&["owner","manager","inventory"].includes(x.role)))return err(403,"Inventory editing permission required.");
  const v=variant.data,product=Array.isArray(v?.product)?v?.product[0]:v?.product;
  const category=product?(Array.isArray(product.category)?product.category[0]:product.category):null;
  if(!v||v.status!=="published"||product?.status!=="published"||v.unit!==value.unit||
     !category||!isAllowedCategoryUnit(String(category.slug),value.unit))
   return err(409,"Select a published product variant and matching unit.");
  const {data:saved,error}=await auth.client.from("inventory")
   .upsert({branch_id:value.branchId,variant_id:value.variantId,unit:value.unit,available_quantity:value.quantity},
           {onConflict:"branch_id,variant_id"})
   .select("branch_id,variant_id,unit,available_quantity,updated_at").single();
  if(error)return err(error.code==="23514"?409:503,"Inventory could not be saved. Check unit and permissions.");
  return apiData({stock:saved,stored:true,stockScope:"verified_dealer_branch",note:"Stock belongs to this dealer branch; checkout and dispatch require separate confirmation."});
 }catch{return apiFailed()}
}
