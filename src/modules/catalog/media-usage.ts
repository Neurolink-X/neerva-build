import type {DemoProduct} from "./marketplace.ts";
/** Prevent repeating the same representative manufacturer photo across a size family.
 * This is presentation grouping, NOT a claim that the photographed SKU matches every size.
 * Do not coalesce products from different brands/categories or with individual photos.
 */
export type PhotoFamily={primary:DemoProduct;variants:DemoProduct[]};
export function groupCatalogByPhoto(products:readonly DemoProduct[]):PhotoFamily[]{
 const groups:PhotoFamily[]=[],indexes=new Map<string,number>();
 for(const product of products){
  const shared=product.verification==="reference"&&product.referenceImage
   &&product.referenceImage.startsWith("/images/catalog/reference/");
  const key=product.familyKey?product.category+"|"+product.brand.toLowerCase()+"|"+product.familyKey:
   shared?product.category+"|"+product.brand.toLowerCase()+"|"+product.referenceImage:"product|"+product.category+"|"+product.slug;
  const index=indexes.get(key);
  if(index===undefined){indexes.set(key,groups.length);groups.push({primary:product,variants:[product]});}
  else groups[index].variants.push(product);
 }
 return groups;
}
export function rangeVariantLabel(p:DemoProduct):string{
 const spec=p.specifications.find(s=>/^(?:Diameter|Thickness|Nominal size|Pack \/ variant)$/i.test(s.label));
 return spec?.value??p.name;
}
