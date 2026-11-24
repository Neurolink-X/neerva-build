import {publicDatabase,timedPublicResponse} from "@/modules/supabase/public-server";
export const dynamic="force-dynamic";

async function readPublic(){
 const db=publicDatabase();
 const prices=[];
 if(!db)return Response.json({prices:[],source:"reference_only"});
 {

  const now=new Date().toISOString();
  const {data,error}=await db.from("pricing_rules").select("amount_paise,unit,city,pincode_prefix,minimum_quantity,valid_to,variant:product_variants!inner(sku,status,unit,product:products!inner(slug,status,category:categories!inner(slug,status)))")
   .eq("visibility","public").eq("status","published").eq("currency","INR").eq("variant.status","published").eq("variant.product.status","published").eq("variant.product.category.status","published")
   .gt("amount_paise",0).lte("valid_from",now).or("valid_to.is.null,valid_to.gt."+now).order("amount_paise").limit(1000);
  if(error)return Response.json({prices:[],unavailable:true},{status:503});
  for(const row of data??[]){
   const v=Array.isArray(row.variant)?row.variant[0]:row.variant;
   const p=Array.isArray(v?.product)?v.product[0]:v?.product;
   const c=Array.isArray(p?.category)?p.category[0]:p?.category;
   if(!c||!p||!v||v.unit!==row.unit||c.slug==="aggregates")continue;
   prices.push({slug:p.slug,category:c.slug,sku:v.sku,unit:row.unit,paise:row.amount_paise,city:row.city,prefix:row.pincode_prefix,min:row.minimum_quantity,until:row.valid_to});
  }
 }
 return Response.json({prices,source:"published_database"},{headers:{"Cache-Control":"no-cache, max-age=0, must-revalidate"}});
}

export async function GET(){const start=performance.now();try{return timedPublicResponse(start,await readPublic())}catch{return timedPublicResponse(start,Response.json({error:"Public data temporarily unavailable",unavailable:true},{status:503}))}}
