import {parseFeedPage,takeFeedPage,parseFeedCategory} from "@/modules/catalog/feed-pagination";
import {createClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";

export async function GET(request:Request){
 const params=new URL(request.url).searchParams,page=parseFeedPage(params),category=parseFeedCategory(params);if(!page||category===null)return Response.json({error:"Invalid price page."},{status:400,headers:{"Cache-Control":"no-store"}});
 let nextCursor:string|null=null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const unavailable=()=>Response.json({prices:[],error:"Published pricing temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store","x-neerva-service-state":"degraded"}});
 if(!url||!key)return unavailable();
 const prices=[];
 try{
  const db=createClient(url,key,{auth:{persistSession:false}});
  const now=new Date().toISOString(),deadline=AbortSignal.any([request.signal,AbortSignal.timeout(7000)]);
  let query=db.from("pricing_rules").select("id,amount_paise,unit,city,pincode_prefix,minimum_quantity,valid_to,variant:product_variants!inner(sku,status,unit,product:products!inner(slug,status,category:categories!inner(slug,status)))")
   .is("tenant_id",null).eq("visibility","public").eq("status","published").eq("currency","INR").eq("variant.status","published").eq("variant.product.status","published").eq("variant.product.category.status","published")
   .gt("amount_paise",0).lte("valid_from",now).or("valid_to.is.null,valid_to.gt."+now).order("id").limit(page.paginated?page.limit+1:page.limit);
  if(category)query=query.eq("variant.product.category.slug",category);
  if(page.after)query=query.gt("id",page.after);
  const {data,error}=await query.abortSignal(deadline);
  if(error||!data||(!page.paginated&&data.length>=1000))return unavailable();
  const slice=takeFeedPage(data,page.limit);nextCursor=slice.nextCursor;
  for(const row of slice.rows){
   const v=Array.isArray(row.variant)?row.variant[0]:row.variant;
   const p=Array.isArray(v?.product)?v.product[0]:v?.product;
   const c=Array.isArray(p?.category)?p.category[0]:p?.category;
   if(!c||!p||!v||(category&&c.slug!==category)||v.unit!==row.unit||/^NEERVA-REF-/i.test(v.sku)||c.slug==="aggregates")continue;
   prices.push({slug:p.slug,category:c.slug,sku:v.sku,unit:row.unit,paise:row.amount_paise,city:row.city,prefix:row.pincode_prefix,min:row.minimum_quantity,until:row.valid_to});
  }
 }catch{return unavailable()}
 prices.sort((a,b)=>a.paise-b.paise);
 return Response.json({prices,nextCursor},{headers:{"Cache-Control":"no-store"}});
}
