import Image from "next/image";
import Link from "@/components/intent-link";
import {getProduct} from "@/modules/catalog/marketplace";
import {catalogVisuals} from "@/modules/catalog/catalog-visuals";
import {isPublicConstructionProduct} from "@/modules/catalog/discovery-policy";
import {categoryChoiceHref} from "@/modules/catalog/category-discovery";
import {QuickShopAdd} from "@/components/shop-cart";
import {HomePrice} from "./home-price";
const picks=[["cement","ppc-cement-50kg"],["steel","fe-500d-tmt-12mm"],["bricks-blocks","red-clay-brick"],["plumbing","cpvc-pipe-25mm"]] as const;
export function HomeFeaturedMaterials(){
 return <div className="nbh-shop-products">{picks.map(([category,slug])=>{
  const p=getProduct(category,slug);if(!p||!isPublicConstructionProduct(p))return null;
  const media=catalogVisuals(p).find(m=>m.src.startsWith("/images/"));
  return <article key={category+"/"+slug} className="nbh-shop-product">
   <Link href={categoryChoiceHref(category,p.slug)} prefetch={false} className="nbh-shop-product-link">
    {media&&<span className="nbh-shop-product-photo"><Image src={media.src} alt={media.alt} fill sizes="(max-width:760px) 42vw, 220px" loading="lazy"/></span>}
    <strong>{p.name}</strong><small>{p.brand}</small>
   </Link>
   {media&&<small className="nbh-shop-photo-note">{media.label}</small>}
   <HomePrice category={category} slug={p.slug} quoteOnly={p.quoteOnly}/>
   <QuickShopAdd product={{category,slug:p.slug,name:p.name,quoteOnly:p.quoteOnly}}/>
  </article>;
 })}</div>;
}
