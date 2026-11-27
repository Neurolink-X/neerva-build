import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {catalogCommand,catalogUpdate,errorFields} from "@/modules/marketplace/write-contract";
import {defaultProductUnit,productUnits} from "@/modules/catalog/category-units";
import {mediaReview} from "@/modules/catalog/media-reconciliation";
import {demoProducts} from "@/modules/catalog/marketplace";
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
  auth.client.from("products").select("id,slug,name,description,attributes,status,category:categories(id,slug,name_en,name_hi,pricing_mode,status),brand:brands(id,name,slug,status,authorized_source),variants:product_variants(id,sku,unit,attributes,status),media:catalog_product_media(id,published)").order("created_at",{ascending:false}).order("id",{ascending:false}).range(offset,offset+100)
 ]);if(a.error||b.error||c.error)return apiFailed();
 const products=(c.data??[]).slice(0,100).map(p=>{
  const category=Array.isArray(p.category)?p.category[0]:p.category;
  const {media,...product}=p;
  return {...product,mediaReview:mediaReview({slug:p.slug,category:category?.slug??"",familyKey:typeof p.attributes?.family_key==="string"?p.attributes.family_key:null,publishedMediaCount:(media??[]).filter(m=>m.published===true).length})};
 });
 return apiData({categories:a.data??[],brands:b.data??[],products,nextOffset:(c.data??[]).length>100?offset+100:null});}catch{return apiFailed();}
}
async function importReferenceBatch(auth:Exclude<Awaited<ReturnType<typeof requireAdmin>>,Response>,offset:number){
 const size=50;
 if(!Number.isInteger(offset)||offset<0||offset%size!==0||offset>=demoProducts.length)return err(400,"Invalid reference import batch.");
 const slice=demoProducts.slice(offset,offset+size);
 const [cats,brands]=await Promise.all([auth.client.from("categories").select("id,slug"),auth.client.from("brands").select("id,slug")]);
 if(cats.error||brands.error)return apiFailed();
 const catMap=new Map((cats.data??[]).map(c=>[c.slug,c.id])),brandMap=new Map((brands.data??[]).map(b=>[b.slug,b.id]));
 if(slice.some(p=>!catMap.has(p.category)))return err(409,"Required reference taxonomy is missing. Import halted.");
 const rows=slice.map(p=>({slug:p.slug,category_id:catMap.get(p.category),brand_id:brandMap.get(p.brand.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""))??null,name:p.name,description:p.description,attributes:{origin:"neerva-static-reference",brand_reference:p.brand,reference_only:true,manufacturer_sku:null,quote_only:!!p.quoteOnly,family_key:p.familyKey??p.slug,specifications:p.specifications,source:p.manufacturerReference??p.referenceSource??null},status:"draft"}));
 const inserted=await auth.client.from("products").upsert(rows,{onConflict:"slug",ignoreDuplicates:true}).select("id");
 if(inserted.error)return apiFailed();
 const matched=await auth.client.from("products").select("id,slug,category_id,status,attributes").in("slug",slice.map(p=>p.slug));
 if(matched.error||matched.data?.length!==slice.length)return err(503,"Catalog reconciliation could not confirm this batch; retry safely.");
 const eligible=new Map(matched.data.filter(p=>p.status==="draft"&&p.attributes?.origin==="neerva-static-reference"&&p.category_id===catMap.get(slice.find(r=>r.slug===p.slug)!.category)).map(p=>[p.slug,p.id]));
 const variants=slice.filter(p=>eligible.has(p.slug)).map(p=>({product_id:eligible.get(p.slug),sku:"NEERVA-REF-"+p.slug,unit:defaultProductUnit(p.category,p.slug),attributes:{reference_only:true,internal_reference_code:true},status:"draft"}));
 const v=variants.length?await auth.client.from("product_variants").upsert(variants,{onConflict:"sku",ignoreDuplicates:true}).select("id"):{data:[],error:null};
 if(v.error)return err(503,"Draft products saved; variants could not be confirmed. Retry this batch safely.");
 const checks=variants.length?await auth.client.from("product_variants").select("sku,product_id,unit,status").in("sku",variants.map(x=>x.sku)):{data:[],error:null};
 if(checks.error||variants.some(x=>!checks.data?.some(y=>y.sku===x.sku&&y.product_id===x.product_id&&y.unit===x.unit&&y.status==="draft")))return err(409,"Reference SKU conflict or unit mismatch. Existing records were not overwritten.");
 return apiData({referenceRows:demoProducts.length,processed:slice.length,createdProducts:inserted.data?.length??0,createdVariants:v.data?.length??0,existingOrReviewed:slice.length-eligible.size,nextOffset:offset+size<demoProducts.length?offset+size:null,publication:"draft_only",pricesCreated:0,stockCreated:0});
}
export async function POST(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const body=await json(request);
 if(body&&typeof body==="object"&&"action" in body&&body.action==="import-reference-drafts"){if(!("offset" in body)||typeof body.offset!=="number")return err(400,"Invalid import request.");try{return await importReferenceBatch(auth,body.offset)}catch{return apiFailed()}}
 const check=catalogCommand.safeParse(body);if(!check.success)return err(400,"Invalid catalog item.",errorFields(check.error));
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
  const {data:product,error}=await auth.client.from("products").select("category_id,slug").eq("id",data.productId).maybeSingle();
  if(error||!product)return err(404,"Product does not exist.");
  const {data:category,error:categoryError}=await auth.client.from("categories").select("slug").eq("id",product.category_id).maybeSingle();
  if(categoryError||!category||!productUnits(String(category.slug),String(product.slug)).some(u=>u===data.unit))return err(400,"Unit does not match the product category.");
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
   const {data:variant}=await auth.client.from("product_variants").select("product_id,unit,sku,attributes").eq("id",data.id).maybeSingle();
   if(!variant)return err(404,"Variant not found.");
   if(/^NEERVA-REF-/i.test(variant.sku)||variant.attributes?.reference_only===true)return err(409,"This is a reference draft, not a verified SKU. Create a real SKU before publishing.");
   const {data:product}=await auth.client.from("products").select("status,category_id,slug").eq("id",variant.product_id).maybeSingle();
   if(product?.status!=="published")return err(409,"Publish the parent product first.");
   const {data:cat}=await auth.client.from("categories").select("slug,status").eq("id",product.category_id).maybeSingle();
   if(cat?.status!=="published"||!productUnits(String(cat.slug),String(product.slug)).some(u=>u===variant.unit))return err(409,"Publish the matching category and valid unit first.");
  }
 }
 try{const {data:saved,error}=await auth.client.from(table).update(row).eq("id",data.id).select("*").maybeSingle();
 if(error)return err(error.code==="23505"?409:503,error.code==="23505"?"This catalog identifier already exists.":"Catalog update failed.");if(!saved)return err(404,"Catalog record not found.");
 return apiData({item:saved,stored:true});}catch{return apiFailed()}
}
