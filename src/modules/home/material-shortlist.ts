import {isMaterialCategory} from "../catalog/category-units.ts";
export type MaterialLink={category:string;slug:string;name:string};
export type Shortlist={saved:MaterialLink[];recent:MaterialLink[];historyEnabled:boolean};
export const shortlistKey="neerva-material-shortlist-v1";
export const emptyShortlist:Shortlist={saved:[],recent:[],historyEnabled:true};
function valid(v:unknown):v is MaterialLink{
 if(!v||typeof v!=="object")return false;
 const p=v as Partial<MaterialLink>;
 return typeof p.category==="string"&&isMaterialCategory(p.category)&&typeof p.slug==="string"&&/^[a-z0-9][a-z0-9-]{0,159}$/.test(p.slug)&&typeof p.name==="string"&&p.name.trim().length>0&&p.name.length<=180;
}
export const materialKey=(p:MaterialLink)=>p.category+"/"+p.slug;
export const materialHref=(p:MaterialLink)=>valid(p)?"/materials/"+materialKey(p):"/materials";
function clean(value:unknown,limit:number):MaterialLink[]{if(!Array.isArray(value))return [];const unique=new Map<string,MaterialLink>();for(const p of value.slice(0,100)){if(valid(p)&&!unique.has(materialKey(p)))unique.set(materialKey(p),{category:p.category,slug:p.slug,name:p.name});if(unique.size>=limit)break}return [...unique.values()]}
export function readShortlist(raw:string|null):Shortlist{
 try{const p=raw&&raw.length<=50000?JSON.parse(raw):null;return {saved:clean(p?.saved,30),recent:p?.historyEnabled===false?[]:clean(p?.recent,8),historyEnabled:p?.historyEnabled!==false}}catch{return emptyShortlist}
}
export function visitMaterial(s:Shortlist,p:MaterialLink):Shortlist{return !s.historyEnabled||!valid(p)?s:{...s,recent:clean([p,...s.recent],8)}}
export function toggleSavedMaterial(s:Shortlist,p:MaterialLink):Shortlist{if(!valid(p))return s;return s.saved.some(x=>materialKey(x)===materialKey(p))?{...s,saved:s.saved.filter(x=>materialKey(x)!==materialKey(p))}:s.saved.length>=30?s:{...s,saved:clean([p,...s.saved],30)}}
