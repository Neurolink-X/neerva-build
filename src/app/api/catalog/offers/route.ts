import {parseFeedPage,takeFeedPage} from "@/modules/catalog/feed-pagination";
import {createClient} from "@supabase/supabase-js";
import {hasRealActiveDiscount} from "@/modules/catalog/offer-eligibility";
export const dynamic="force-dynamic";
export const runtime="nodejs";
type Price={id:string;amount_paise:number;unit:string;city:string;minimum_quantity:number;pincode_prefix:string|null;valid_from:string;valid_to:string|null;status:string;visibility:string;currency:string;tenant_id:string|null;
 variant:{sku:string;status:string;unit:string;product:{slug:string;status:string;category:{slug:string;status:string}}}|null};
const single=<T,>(record:T|T[]|null|undefined):T|null=>Array.isArray(record)?record[0]??null:record??null;
export async function GET(request:Request){
 const page=parseFeedPage(new URL(request.url).searchParams);if(!page)return Response.json({error:"Invalid offer page."},{status:400,headers:{"Cache-Control":"no-store"}});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return Response.json({offers:[],error:"Published offers temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store","x-neerva-service-state":"degraded"}});
 try{
  const db=createClient(url,key,{auth:{persistSession:false}});
  const now=new Date().toISOString(),deadline=AbortSignal.any([request.signal,AbortSignal.timeout(7000)]);
  let query=db.from("catalog_campaigns").select(
   "id,title,terms,base_amount_paise,offer_amount_paise,starts_at,ends_at,price:pricing_rules!inner(id,amount_paise,unit,city,minimum_quantity,pincode_prefix,valid_from,valid_to,status,visibility,currency,tenant_id,variant:product_variants!inner(sku,status,unit,product:products!inner(slug,status,category:categories!inner(slug,status))))"
  ).eq("status","published").lte("starts_at",now).gt("ends_at",now).order("id").limit(page.paginated?page.limit+1:page.limit);
  if(page.after)query=query.gt("id",page.after);
  const {data,error}=await query.abortSignal(deadline);
  if(error||!data||(!page.paginated&&data.length>=1000))return Response.json({offers:[]},{status:503,headers:{"Cache-Control":"no-store"}});
  const offers=[];
  const slice=takeFeedPage(data,page.limit);
  for(const row of slice.rows){
   const price=single(row.price) as Price|null;
   const variant=single(price?.variant),product=single(variant?.product),category=single(product?.category);
   if(!price||!variant||!product||!category||/^NEERVA-REF-/i.test(variant.sku))continue;
   if(price.tenant_id!==null||price.currency!=="INR"||price.unit!==variant.unit||price.status!=="published"||price.visibility!=="public"||variant.status!=="published"||
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
  return Response.json({offers,nextCursor:slice.nextCursor},{headers:{"Cache-Control":"public, max-age=30"}});
 }catch{return Response.json({offers:[]},{status:503,headers:{"Cache-Control":"no-store"}});}
}
