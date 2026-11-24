import {publicDatabase,timedPublicResponse} from "@/modules/supabase/public-server";
import {hasRealActiveDiscount} from "@/modules/catalog/offer-eligibility";
export const dynamic="force-dynamic";
export const runtime="nodejs";
type Price={id:string;amount_paise:number;unit:string;city:string;minimum_quantity:number;pincode_prefix:string|null;valid_from:string;valid_to:string|null;status:string;visibility:string;
 variant:{sku:string;status:string;product:{slug:string;status:string;category:{slug:string;status:string}}}|null};
const single=<T,>(record:T|T[]|null|undefined):T|null=>Array.isArray(record)?record[0]??null:record??null;
async function readPublic(){
 const db=publicDatabase();
 if(!db)return Response.json({offers:[],source:"reference_only"},{headers:{"Cache-Control":"public, max-age=30"}});
 try{

  const now=new Date().toISOString();
  const {data,error}=await db.from("catalog_campaigns").select(
   "id,title,terms,base_amount_paise,offer_amount_paise,starts_at,ends_at,price:pricing_rules!inner(id,amount_paise,unit,city,minimum_quantity,pincode_prefix,valid_from,valid_to,status,visibility,variant:product_variants!inner(sku,status,product:products!inner(slug,status,category:categories!inner(slug,status))))"
  ).eq("status","published").lte("starts_at",now).gt("ends_at",now).limit(80);
  if(error)return Response.json({offers:[],unavailable:true},{status:503});
  const offers=[];
  for(const row of data??[]){
   const price=single(row.price) as Price|null;
   const variant=single(price?.variant),product=single(variant?.product),category=single(product?.category);
   if(!price||!variant||!product||!category)continue;
   if(price.status!=="published"||price.visibility!=="public"||variant.status!=="published"||
    product.status!=="published"||category.status!=="published"||category.slug==="aggregates")continue;
   if(!hasRealActiveDiscount({
    basePaise:row.base_amount_paise,offerPaise:row.offer_amount_paise,
    startsAt:row.starts_at,endsAt:row.ends_at,priceAmountPaise:price.amount_paise,
    priceStatus:price.status,visibility:price.visibility,
    priceStartsAt:price.valid_from,priceEndsAt:price.valid_to
   },Date.now()))continue;
   offers.push({id:row.id,title:row.title,terms:row.terms,category:category.slug,slug:product.slug,
    sku:variant.sku,city:price.city,unit:price.unit,prefix:price.pincode_prefix,
    min:price.minimum_quantity,basePaise:row.base_amount_paise,offerPaise:row.offer_amount_paise,
    endsAt:row.ends_at});
  }
  return Response.json({offers,source:"published_database"},{headers:{"Cache-Control":"public, max-age=30"}});
 }catch{return Response.json({offers:[]},{headers:{"Cache-Control":"public, max-age=30"}});}
}

export async function GET(){const start=performance.now();try{return timedPublicResponse(start,await readPublic())}catch{return timedPublicResponse(start,Response.json({error:"Public data temporarily unavailable",unavailable:true},{status:503}))}}
