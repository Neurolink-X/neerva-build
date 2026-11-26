import {validPublicRate,validPublicOffer,type PublicRate,type PublicOffer} from "../catalog/public-feed-validation.ts";
import {cartKey,type CartItem} from "./direct-cart.ts";
export type EstimateLine={key:string;sku:string;unitPaise:number;materialPaise:number;discountPaise:number;until:string|null};
export function estimateCart(items:CartItem[],pin:string,city:string,rates:unknown[],offers:unknown[],now:number){
 const validLocation=/^[1-9][0-9]{5}$/.test(pin)&&city.trim().length>=2;
 const matches=(x:{city:string;prefix:string|null;min:number},item:CartItem)=>validLocation&&x.city.trim().toLowerCase()===city.trim().toLowerCase()&&(!x.prefix||pin.startsWith(x.prefix))&&item.quantity>=x.min;
 const current=rates.filter((r):r is PublicRate=>validPublicRate(r,now)),campaigns=offers.filter((o):o is PublicOffer=>validPublicOffer(o,now));
 const lines=items.map(item=>{
  const eligible=current.filter(r=>r.category===item.category&&r.slug===item.productSlug&&r.unit===item.unit&&matches(r,item));
  // A family reference with multiple SKU identities is not an exact price.
  if(new Set(eligible.map(r=>r.sku)).size!==1)return null;
  // Prefer most specific location and highest qualifying quantity slab; never use an unrelated cheaper price.
  const rank=(a:PublicRate,b:PublicRate)=>(b.prefix?.length??0)-(a.prefix?.length??0)||b.min-a.min||a.paise-b.paise;
  const r=eligible.sort(rank)[0];if(!r)return null;
  const deal=campaigns.filter(o=>o.category===r.category&&o.slug===r.slug&&o.sku===r.sku&&o.unit===r.unit&&o.basePaise===r.paise&&o.min===r.min&&o.prefix===r.prefix&&matches(o,item)).sort((a,b)=>a.offerPaise-b.offerPaise)[0];
  const milli=Math.round(item.quantity*1000),material=Number((BigInt(r.paise)*BigInt(milli)+500n)/1000n),net=Number((BigInt(deal?.offerPaise??r.paise)*BigInt(milli)+500n)/1000n);
  if(!Number.isSafeInteger(material)||!Number.isSafeInteger(net))return null;
  return {key:cartKey(item),sku:r.sku,unitPaise:deal?.offerPaise??r.paise,materialPaise:material,discountPaise:material-net,until:deal&&(!r.until||Date.parse(deal.endsAt)<Date.parse(r.until))?deal.endsAt:r.until};
 });
 const total=lines.reduce((sum,r)=>sum+(r?.materialPaise??0),0),discount=lines.reduce((sum,r)=>sum+(r?.discountPaise??0),0);
 return {lines,complete:items.length>0&&lines.every(Boolean)&&Number.isSafeInteger(total)&&Number.isSafeInteger(discount),subtotalPaise:total,discountPaise:discount};
}
