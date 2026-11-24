import type {DemoProduct} from "./marketplace.ts";
import {approvedMedia} from "./approved-family-media.ts";
import {hardwareReference} from "./hardware-references.ts";
import {fittingReference,type FittingRef} from "./fitting-references.ts";
export function mediaFamily(p:DemoProduct){return p.familyKey??p.slug;}
export function approvedFamilyMedia(p:DemoProduct){
 const candidates=approvedMedia.filter(m=>m.verified&&m.category===p.category&&(m.scope==="sku"?m.family===p.slug:m.family===mediaFamily(p))).sort((a,b)=>Number(b.scope==="sku")-Number(a.scope==="sku")||Number(b.primary)-Number(a.primary)||a.sortOrder-b.sortOrder);
 const hashes=new Set<string>(),views=new Set<string>();return candidates.filter(m=>{if(hashes.has(m.sha256)||views.has(m.view))return false;hashes.add(m.sha256);views.add(m.view);return true;});
}
export function fittingDepartment(f:Pick<FittingRef,"slug"|"group">):"tank"|"pipe"|"pump"{return f.group==="pump"?"pump":/fitting-(?:tank-|float-valve$|overflow$|gasket$|grommet$)/.test(f.slug)?"tank":"pipe";}
export const fittingDepartmentNames={tank:"Water tank fittings",pipe:"Pipe fittings and valves",pump:"Motor and pump fittings"} as const;
export function mediaDepartment(p:DemoProduct){const f=fittingReference(p.slug);if(f)return fittingDepartmentNames[fittingDepartment(f)];const h=hardwareReference(p.slug);return h?.group??p.category;}
