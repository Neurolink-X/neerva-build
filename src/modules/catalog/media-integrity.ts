import type {DemoProduct} from "./marketplace.ts";
import {approvedMedia} from "./approved-family-media.ts";
import {hardwareReference} from "./hardware-references.ts";
import {fittingReference,type FittingRef} from "./fitting-references.ts";
export function mediaFamily(p:DemoProduct){return p.familyKey??p.slug;}
type Media=(typeof approvedMedia)[number];
// One immutable index per module load, rather than scanning and sorting the
// entire manifest for every card, variant and detail-page render.
const mediaIndex=new Map<string,Media[]>();
const indexKey=(category:string,scope:string,family:string)=>category+":"+scope+":"+family;
const compareMedia=(a:Media,b:Media)=>Number(b.scope==="sku")-Number(a.scope==="sku")||Number(b.primary)-Number(a.primary)||a.sortOrder-b.sortOrder;
for(const media of approvedMedia){if(!media.verified)continue;const key=indexKey(media.category,media.scope,media.family);const list=mediaIndex.get(key)??[];list.push(media);mediaIndex.set(key,list);}
for(const list of mediaIndex.values())list.sort(compareMedia);
export function approvedFamilyMedia(p:DemoProduct){
 const exact=mediaIndex.get(indexKey(p.category,"sku",p.slug))??[];
 const family=mediaIndex.get(indexKey(p.category,"family",mediaFamily(p)))??[];
 const hashes=new Set<string>(),views=new Set<string>();
 return [...exact,...family].filter(m=>{if(hashes.has(m.sha256)||views.has(m.view))return false;hashes.add(m.sha256);views.add(m.view);return true;});
}
export function fittingDepartment(f:Pick<FittingRef,"slug"|"group">):"tank"|"pipe"|"pump"{return f.group==="pump"?"pump":/fitting-(?:tank-|float-valve$|overflow$|gasket$|grommet$)/.test(f.slug)?"tank":"pipe";}
export const fittingDepartmentNames={tank:"Water tank fittings",pipe:"Pipe fittings and valves",pump:"Motor and pump fittings"} as const;
export function mediaDepartment(p:DemoProduct){const f=fittingReference(p.slug);if(f)return fittingDepartmentNames[fittingDepartment(f)];const h=hardwareReference(p.slug);return h?.group??p.category;}
