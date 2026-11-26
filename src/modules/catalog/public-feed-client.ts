/** One in-flight public request per feed and revision per browser tab.
 * Only successful public data is reused briefly; never cache accounts or orders. */
type Feed="prices"|"offers";
type Entry={revision:number;at:number;data?:unknown;pending?:Promise<unknown>};
const entries=new Map<Feed,Entry>();
let revision=0;
export function invalidatePublicFeeds(){revision++;entries.clear();}
export function loadPublicFeed(kind:Feed):Promise<unknown>{
 const now=Date.now(),existing=entries.get(kind);
 if(existing?.revision===revision){
  if(existing.pending)return existing.pending;
  if(existing.data!==undefined&&now-existing.at<1500)return Promise.resolve(existing.data);
 }
 const entry:Entry={revision,at:0};
 entries.set(kind,entry);
 entry.pending=fetch("/api/catalog/"+kind,{cache:"no-store",signal:AbortSignal.timeout(10000)}).then(async r=>{
  if(!r.ok)throw Error("Public "+kind+" unavailable");
  const value=await r.json();
  if(!value||!Array.isArray(value[kind]))throw Error("Invalid "+kind+" response");
  if(entry.revision!==revision)throw Error("Public feed was revised");
  entry.data=value;entry.at=Date.now();return value;
 }).catch(error=>{if(entries.get(kind)===entry)entries.delete(kind);throw error}).finally(()=>{entry.pending=undefined});
 return entry.pending;
}
