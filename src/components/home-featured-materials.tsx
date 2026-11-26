import Link from "@/components/intent-link";
import {getProduct,getProductsByCategory} from "@/modules/catalog/marketplace";
import {isPublicConstructionProduct} from "@/modules/catalog/discovery-policy";
import {categoryChoiceHref} from "@/modules/catalog/category-discovery";
import {QuickShopAdd} from "@/components/shop-cart";
import type {ReactNode} from "react";
// One exact product action inside the existing category card, not another product shelf.
// Category images remain category references; never imply that they depict this SKU.
const picks=[["cement","ppc-cement-50kg"],["steel","fe-500d-tmt-12mm"],["bricks-blocks","red-clay-brick"],["plumbing","cpvc-pipe-25mm"]] as const;
export function homeCategoryCartActions():Record<string,ReactNode>{
 const actions:Record<string,ReactNode>={};
 for(const category of ["cement","steel","bricks-blocks","plumbing","paint","electrical","aggregates","tiles","hardware"]){
  const slug=picks.find(([key])=>key===category)?.[1];
  const preferred=slug?getProduct(category,slug):undefined;
  const products=getProductsByCategory(category).filter(isPublicConstructionProduct);
  const p=preferred&&isPublicConstructionProduct(preferred)?preferred:products.find(x=>!x.quoteOnly&&x.imageVerified)??products.find(x=>!x.quoteOnly)??products[0];
  if(!p)continue;
  actions[category]=<div className="nbh-category-cart"><Link href={categoryChoiceHref(category,p.slug)} prefetch={false} className="nbh-category-cart-product">{p.name} · {p.brand}</Link><QuickShopAdd product={{category,slug:p.slug,name:p.name,quoteOnly:p.quoteOnly}}/></div>;
 }
 return actions;
}
