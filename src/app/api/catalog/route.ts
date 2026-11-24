import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {catalogCategories} from "@/modules/catalog/catalog";
/** Public RLS-only catalog: never use the service-role key or show draft SKUs as stock. */
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-cache, max-age=0, must-revalidate","X-Content-Type-Options":"nosniff"};
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const referenceCategories=catalogCategories.map(({slug,title,titleHi,description,quoteOnly})=>({
  slug,title,titleHi,description,pricingMode:quoteOnly?"quotation":"published-price-required"
 }));
 if(!url||!key)return NextResponse.json({categories:referenceCategories,products:[],source:"reference_only",stockVerified:false,
   note:"Catalog connection is not configured. Reference taxonomy only; no verified product listings or stock."},{headers});
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const [categories,products]=await Promise.all([
   db.from("categories").select("id,slug,name_en,name_hi,pricing_mode").eq("status","published").order("name_en").limit(100),
   db.from("products").select("id,slug,name,description,attributes,category:categories(slug),brand:brands(name),variants:product_variants(id,sku,unit,attributes,status),media:catalog_product_media(id,storage_path,alt_text,published)").eq("status","published").limit(100)
  ]);
  if(categories.error||products.error)throw Error("Catalog RLS read unavailable");
  const visibleMedia=(products.data??[]).flatMap(p=>p.media??[]).filter(m=>m.published).slice(0,200);
  const signed=visibleMedia.length?await db.storage.from("neerva-catalog-media").createSignedUrls(visibleMedia.map(m=>m.storage_path),300):null;
  const urls=new Map((signed?.data??[]).filter(m=>m.signedUrl).map(m=>[m.path,m.signedUrl]));
  return NextResponse.json({
   categories:(categories.data??[]).map(c=>({id:c.id,slug:c.slug,title:c.name_en,titleHi:c.name_hi,
    description:catalogCategories.find(d=>d.slug===c.slug)?.description??"",pricingMode:c.pricing_mode})),
   products:(products.data??[]).map(p=>({id:p.id,slug:p.slug,name:p.name,description:p.description,attributes:p.attributes,
    category:p.category,brand:p.brand,variants:p.variants,images:(p.media??[]).filter(m=>m.published&&urls.has(m.storage_path)).map(m=>({url:urls.get(m.storage_path),alt:m.alt_text})),inventoryVerified:false,offerVerified:false})),
   source:"published_database",stockVerified:false,
   note:"Published product identities only. Exact availability, price, dealer authorisation and images require separately verified records."
  },{headers});
 }catch{
  return NextResponse.json({categories:referenceCategories,products:[],source:"reference_fallback",stockVerified:false,
   note:"Live catalog temporarily unavailable; only non-commercial reference categories are shown."},{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 }
}
