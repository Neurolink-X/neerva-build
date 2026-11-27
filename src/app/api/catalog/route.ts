import {boundedFetch} from "@/modules/http/bounded-fetch";
import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {catalogCategories} from "@/modules/catalog/catalog";
import {parsePublishedCatalogPage,takePublishedCatalogPage} from "@/modules/catalog/published-page";
/** Public RLS-only catalog: never use the service-role key or show draft SKUs as stock. */
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"public, max-age=30, stale-while-revalidate=120","X-Content-Type-Options":"nosniff"};
export async function GET(request:Request){
 const page=parsePublishedCatalogPage(new URL(request.url).searchParams);
 if(!page)return NextResponse.json({error:"Invalid catalog page parameters."},{status:400,headers:{"Cache-Control":"no-store"}});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const referenceCategories=catalogCategories.map(({slug,title,titleHi,description,quoteOnly})=>({
  slug,title,titleHi,description,pricingMode:quoteOnly?"quotation":"published-price-required"
 }));
 if(!url||!key)return NextResponse.json({categories:referenceCategories,products:[],nextCursor:null,source:"reference_only",stockVerified:false,
   note:"Live products are temporarily unavailable. You can browse reference categories; current stock and prices are not verified."},{headers:{"Cache-Control":"no-store","X-Neerva-Service-State":"degraded","X-Content-Type-Options":"nosniff"}});
 try{
  // Bound the entire anonymous catalog read, including Storage signing, to one deadline.
  const deadline=AbortSignal.any([request.signal,AbortSignal.timeout(7000)]);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:boundedFetch(deadline,7000)}});
  const categories=await db.from("categories").select("id,slug,name_en,name_hi,pricing_mode").eq("status","published").order("name_en").limit(100);
  if(categories.error)throw Error("Catalog taxonomy read unavailable");
  const categoryId=page.category?(categories.data??[]).find(c=>c.slug===page.category)?.id:null;
  let query=db.from("products").select("id,slug,name,description,attributes,category:categories(slug),brand:brands(name),variants:product_variants(id,sku,unit,attributes,status),media:catalog_product_media(id,storage_path,alt_text,published)").eq("status","published").eq("variants.status","published").eq("media.published",true).order("slug",{ascending:true}).limit(page.limit+1);
  if(categoryId)query=query.eq("category_id",categoryId);
  if(page.after)query=query.gt("slug",page.after);
  const result=page.category&&!categoryId?{data:[],error:null}:await query;
  if(result.error)throw Error("Catalog RLS read unavailable");
  const {products,nextCursor}=takePublishedCatalogPage(result.data??[],page.limit);
  const mediaPaths=[...new Set(products.flatMap(p=>p.media??[]).filter(m=>m.published).map(m=>m.storage_path))].slice(0,200);
  const signed=mediaPaths.length?await db.storage.from("neerva-catalog-media").createSignedUrls(mediaPaths,300):null;
  const urls=new Map((signed?.data??[]).filter(m=>m.signedUrl).map(m=>[m.path,m.signedUrl]));
  return NextResponse.json({
   categories:(categories.data??[]).map(c=>({id:c.id,slug:c.slug,title:c.name_en,titleHi:c.name_hi,
    description:catalogCategories.find(d=>d.slug===c.slug)?.description??"",pricingMode:c.pricing_mode})),
   nextCursor,
   products:products.map(p=>({id:p.id,slug:p.slug,name:p.name,description:p.description,attributes:p.attributes,
    category:p.category,brand:p.brand,variants:(p.variants??[]).filter(v=>v.status==="published"),images:(p.media??[]).filter(m=>m.published&&urls.has(m.storage_path)).map(m=>({url:urls.get(m.storage_path),alt:m.alt_text})),inventoryVerified:false,offerVerified:false})),
   source:"published_database",stockVerified:false,
   note:"Published product identities only. Exact availability, price, dealer authorisation and images require separately verified records."
  },{headers});
 }catch{
  console.error("[neerva.catalog] published data unavailable; inspect database connection and query logs");
  return NextResponse.json({categories:referenceCategories,products:[],nextCursor:null,source:"reference_fallback",stockVerified:false,
   note:"Live products are temporarily unavailable. You can browse reference categories; current stock and prices are not verified."},{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","X-Neerva-Service-State":"degraded"}});
 }
}
