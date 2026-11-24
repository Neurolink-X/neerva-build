import type {DemoProduct} from "./marketplace.ts";
import {approvedMedia} from "./approved-family-media.ts";
import {hardwareReference} from "./hardware-references.ts";
import {fittingReference} from "./fitting-references.ts";
export function mediaFamily(p:DemoProduct){return p.familyKey??p.slug;}
export function approvedFamilyMedia(p:DemoProduct){return approvedMedia.filter(m=>m.category===p.category&&(m.scope==="sku"?m.family===p.slug:m.family===mediaFamily(p))).sort((a,b)=>Number(b.primary)-Number(a.primary)||a.sortOrder-b.sortOrder).filter((m,i,all)=>all.findIndex(x=>x.sha256===m.sha256||x.view===m.view)===i);}
export function mediaDepartment(p:DemoProduct){const f=fittingReference(p.slug);if(f)return f.group==="pump"?"Motor and pump fittings":"Tank and plumbing fittings";const h=hardwareReference(p.slug);return h?.group??p.category;}
