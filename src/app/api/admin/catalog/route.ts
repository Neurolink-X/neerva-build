import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {catalogCommand,catalogUpdate,errorFields} from "@/modules/marketplace/write-contract";
import {isAllowedCategoryUnit} from "@/modules/catalog/category-units";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};
const err=(status:number,error:string,fields?:unknown)=>Response.json({error,...(fields?{fields}:{})},{status,headers});
async function json(request:Request){if(!request.headers.get("content-type")?.includes("application/json"))return null;
 const length=Number(request.headers.get("content-length")||0);if(length>12000)return null;
 try{const body=await request.text();if(body.length>12000)return null;return JSON.parse(body) as unknown}catch{return null;}
}
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const raw=new URL(request.url).searchParams.get("offset")??"0";
 if(!/^\d{1,6}$/.test(raw)||Number(raw)%100!==0)return err(400,"Invalid catalog batch offset.");
 const offset=Number(raw);
 try{const [a,b,c]=await Promise.all([
  auth.client.from("categories").select("id,slug,name_en,name_hi,pricing_mode,status").order("name_en"),
  auth.client.from("brands").select("id,name,slug,authorized_source,status").order("name"),
  auth.client.from("products").select("id,slug,name,description,attributes,status,category:categories(id,slug,name_en,name_hi,pricing_mode,status),brand:brands(id,name,slug,status,authorized_source),variants:product_variants(id,sku,unit,attributes,status)").order("created_at",{ascending:false}).order("id",{ascending:false}).range(offset,offset+100)
 ]);if(a.error||b.error||c.error)return apiFailed();
 return apiData({categories:a.data??[],brands:b.data??[],products:(c.data??[]).slice(0,100),nextOffset:(c.data??[]).length>100?offset+100:null});}catch{return apiFailed();}
}
export async function POST(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const check=catalogCommand.safeParse(await json(request));if(!check.success)return err(400,"Invalid catalog item.",errorFields(check.error));
 const data=check.data;let table:string,row:Record<string,unknown>;
 switch(data.kind){
 case "category":table="categories";row={slug:data.slug,name_en:data.nameEn,name_hi:data.nameHi,pricing_mode:data.pricingMode,status:"draft"};break;
 case "brand":table="brands";row={slug:data.slug,name:data.name,authorized_source:data.authorizedSource??null,status:"draft"};break;
 case "product":{
  const [cat,brand]=await Promise.all([
   auth.client.from("categories").select("id").eq("id",data.categoryId).maybeSingle(),
   data.brandId?auth.client.from("brands").select("id").eq("id",data.brandId).maybeSingle():Promise.resolve({data:null,error:null})
  ]);
  if(cat.error||!cat.data||data.brandId&&(brand.error||!brand.data))return err(400,"Category or brand not found.");
  table="products";row={slug:data.slug,name:data.name,description:data.description,category_id:data.categoryId,brand_id:data.brandId??null,attributes:data.attributes,status:"draft"};break;
 }
 case "variant":{
  const {data:product,error}=await auth.client.from("products").select("category_id").eq("id",data.productId).maybeSingle();
  if(error||!product)return err(404,"Product does not exist.");
  const {data:category,error:categoryError}=await auth.client.from("categories").select("slug").eq("id",product.category_id).maybeSingle();
  if(categoryError||!category||!isAllowedCategoryUnit(String(category.slug),data.unit))return err(400,"Unit does not match the product category.");
  table="product_variants";row={product_id:data.productId,sku:data.sku,unit:data.unit,attributes:data.attributes,status:"draft"};break;
 }
 }
 try{
  const {data:saved,error}=await auth.client.from(table).insert(row).select("*").single();
  if(error)return err(error.code==="23505"?409:503,error.code==="23505"?"This catalog identifier already exists.":"Catalog item was not saved.");
  return Response.json({item:saved,kind:data.kind,stored:true,reviewStatus:"draft"},{status:201,headers});
 }catch{return apiFailed()}
}
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const check=catalogUpdate.safeParse(await json(request));if(!check.success)return err(400,"Invalid catalog update.",errorFields(check.error));
 const data=check.data;
 const table=({category:"categories",brand:"brands",product:"products",variant:"product_variants"} as const)[data.kind];
 const row:Record<string,unknown>={status:data.status};
 if(data.kind==="category"){if(data.nameEn)row.name_en=data.nameEn;if(data.nameHi)row.name_hi=data.nameHi;if(data.pricingMode)row.pricing_mode=data.pricingMode;}
 if(data.kind==="brand"){if(data.authorizedSource)row.authorized_source=data.authorizedSource;if(data.name)row.name=data.name;}
 if(data.kind==="product"){if(data.description!==undefined)row.description=data.description;if(data.name)row.name=data.name;if(data.attributes!==undefined)row.attributes=data.attributes;}
 if(data.kind==="variant"&&data.attributes!==undefined)row.attributes=data.attributes;
 if(data.status==="published"){
  if(data.kind==="brand"){
   const {data:brand}=await auth.client.from("brands").select("authorized_source").eq("id",data.id).maybeSingle();
   if(!(data.kind==="brand"&&(data.authorizedSource||brand?.authorized_source)))return err(409,"A manufacturer reference URL is required before publishing a brand; verify rights separately.");
  }
  if(data.kind==="product"){
   const {data:product,error}=await auth.client.from("products").select("category_id,brand_id").eq("id",data.id).maybeSingle();
   if(error)return apiFailed();if(!product)return err(404,"Product not found.");
   const [cat,brand]=await Promise.all([auth.client.from("categories").select("status").eq("id",product.category_id).maybeSingle(),product.brand_id?auth.client.from("brands").select("status").eq("id",product.brand_id).maybeSingle():Promise.resolve({data:null,error:null})]);
   if(cat.error||brand.error)return apiFailed();
   if(cat.data?.status!=="published"||(product.brand_id&&brand.data?.status!=="published"))return err(409,"Publish the matching category and brand first.");
  }
  if(data.kind==="variant"){
   const {data:variant}=await auth.client.from("product_variants").select("product_id,unit").eq("id",data.id).maybeSingle();
   if(!variant)return err(404,"Variant not found.");
   const {data:product}=await auth.client.from("products").select("status,category_id").eq("id",variant.product_id).maybeSingle();
   if(product?.status!=="published")return err(409,"Publish the parent product first.");
   const {data:cat}=await auth.client.from("categories").select("slug,status").eq("id",product.category_id).maybeSingle();
   if(cat?.status!=="published"||!isAllowedCategoryUnit(String(cat.slug),String(variant.unit)))return err(409,"Publish the matching category and valid unit first.");
  }
 }
 try{const {data:saved,error}=await auth.client.from(table).update(row).eq("id",data.id).select("*").maybeSingle();
 if(error)return err(error.code==="23505"?409:503,error.code==="23505"?"This catalog identifier already exists.":"Catalog update failed.");if(!saved)return err(404,"Catalog record not found.");
 return apiData({item:saved,stored:true});}catch{return apiFailed()}
}
