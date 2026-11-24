import {createClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";

export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const prices=[];
 if(url&&key){
  const db=createClient(url,key,{auth:{persistSession:false}});
  const now=new Date().toISOString();
  const {data,error}=await db.from("pricing_rules").select("amount_paise,unit,city,pincode_prefix,minimum_quantity,valid_to,variant:product_variants!inner(sku,status,unit,product:products!inner(slug,status,category:categories!inner(slug,status)))")
   .is("tenant_id",null).eq("visibility","public").eq("status","published").eq("currency","INR").eq("variant.status","published").eq("variant.product.status","published").eq("variant.product.category.status","published")
   .gt("amount_paise",0).lte("valid_from",now).or("valid_to.is.null,valid_to.gt."+now).order("amount_paise").limit(1000);
  if(error)return Response.json({prices:[]},{status:503});
  for(const row of data??[]){
   const v=Array.isArray(row.variant)?row.variant[0]:row.variant;
   const p=Array.isArray(v?.product)?v.product[0]:v?.product;
   const c=Array.isArray(p?.category)?p.category[0]:p?.category;
   if(!c||!p||!v||v.unit!==row.unit||c.slug==="aggregates")continue;
   prices.push({slug:p.slug,category:c.slug,sku:v.sku,unit:row.unit,paise:row.amount_paise,city:row.city,prefix:row.pincode_prefix,min:row.minimum_quantity,until:row.valid_to});
  }
 }
 return Response.json({prices},{headers:{"Cache-Control":"public, max-age=30"}});
}
