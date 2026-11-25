import type {DemoProduct} from "./marketplace.ts";
import {catalogPhotos,type CatalogPhoto} from "./catalog-photos.ts";
import {isLocalCatalogMedia} from "./local-media-policy.ts";
import {generatedVisuals} from "./generated-visuals.ts";
const index=new Map(generatedVisuals.map(m=>[m.category+":"+m.family,m]));
export type CatalogVisual=CatalogPhoto|{src:string;label:string;alt:string;kind:"generated";sourceUrl?:never;credit?:never;license?:never;licenseUrl?:never};
export function catalogVisuals(product:DemoProduct):CatalogVisual[]{
 const photos=catalogPhotos(product).filter(p=>isLocalCatalogMedia(p.src));
 // Direct accessory routes may use a correctly mapped generic illustration too.
 // This does not change public discovery or promote hidden accessories.
 if(photos.some(p=>p.src.startsWith("/")&&p.kind!=="category"))return photos;
 const m=index.get(product.category+":"+(product.familyKey??product.slug));
 if(!m)return photos;
 if(!/^(?:local\b|brand to confirm$|dealer-listed brand$|mill to confirm$)/i.test(product.brand))return photos;
 return [{src:m.path,kind:"generated",label:"AI-generated reference · not exact product",alt:m.alt+"; illustrative appearance only"},...photos.filter(p=>p.kind!=="category")];
}
