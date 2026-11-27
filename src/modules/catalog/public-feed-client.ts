/** One in-flight public request per feed and revision per browser tab.
 * Only successful public data is reused for at most ten seconds; never cache accounts or orders. */
import {FEED_MAX_PAGES,FEED_PAGE_SIZE,feedCursor} from "./feed-pagination.ts";
type Feed="prices"|"offers";
type Entry={revision:number;at:number;data?:unknown;pending?:Promise<unknown>;controller?:AbortController};
const entries=new Map<Feed,Entry>();
let revision=0;
export function invalidatePublicFeeds(){revision++;for(const entry of entries.values())entry.controller?.abort();entries.clear();}
export function loadPublicFeed(kind:Feed):Promise<unknown>{
 const now=Date.now(),existing=entries.get(kind);
 if(existing?.revision===revision){
  if(existing.pending)return existing.pending;
  if(existing.data!==undefined&&now-existing.at<10000)return Promise.resolve(existing.data);
 }
 const controller=new AbortController();
 const deadline=setTimeout(()=>controller.abort(),10000);
 const entry:Entry={revision,at:0,controller};
 entries.set(kind,entry);
 entry.pending=(async()=>{
  const rows:unknown[]=[],seen=new Set<string>();let cursor:string|null=null;
  for(let page=0;page<FEED_MAX_PAGES;page++){
   const params=new URLSearchParams({limit:String(FEED_PAGE_SIZE)});if(cursor)params.set("after",cursor);
   const r=await fetch("/api/catalog/"+kind+"?"+params,{cache:"no-store",signal:controller.signal});
   if(!r.ok)throw Error("Public "+kind+" unavailable");
   const value=await r.json();
   if(!value||!Array.isArray(value[kind])||value[kind].length>FEED_PAGE_SIZE)throw Error("Invalid "+kind+" response");
   if(entry.revision!==revision)throw Error("Public feed was revised");
   rows.push(...value[kind]);
   if(value.nextCursor==null){
    if(kind==="prices")rows.sort((a,b)=>Number((a as {paise?:number})?.paise??Infinity)-Number((b as {paise?:number})?.paise??Infinity));
    const result={[kind]:rows};entry.data=result;entry.at=Date.now();return result;
   }
   if(!feedCursor(value.nextCursor)||seen.has(value.nextCursor)||cursor!==null&&value.nextCursor<=cursor)throw Error("Invalid public feed cursor");
   cursor=value.nextCursor;seen.add(cursor);
  }
  throw Error("Public feed exceeds safe page budget");
 })().catch(error=>{if(entries.get(kind)===entry)entries.delete(kind);throw entry.revision!==revision?Error("Public feed was revised"):error}).finally(()=>{clearTimeout(deadline);entry.pending=undefined;entry.controller=undefined});
 return entry.pending;
}
