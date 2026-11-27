import {validProductQuantity} from "../catalog/category-units.ts";
export const DIRECT_CART_KEY="neerva-direct-cart-v1";
export type CartItem={category:string;productSlug:string;productName:string;quantity:number;unit:string};
export function safeDirectCart(raw:unknown):CartItem[]{if(!Array.isArray(raw))return [];const out:CartItem[]=[];for(const r of raw.slice(0,100)){if(!r||typeof r!=="object"||typeof r.category!=="string"||typeof r.productSlug!=="string"||!/^[a-z0-9-]{1,100}$/.test(r.productSlug)||typeof r.productName!=="string"||r.productName.trim().length<2||typeof r.unit!=="string"||typeof r.quantity!=="number"||!validProductQuantity(r.category,r.productSlug,r.unit,r.quantity))continue;const quantity=Math.round(r.quantity*1000)/1000;if(!validProductQuantity(r.category,r.productSlug,r.unit,quantity))continue;if(out.some(x=>cartKey(x)===cartKey(r)))continue;out.push({category:r.category,productSlug:r.productSlug,productName:r.productName.slice(0,240),quantity,unit:r.unit});if(out.length>=25)break;}return out;}
export const cartKey=(x:Pick<CartItem,"category"|"productSlug"|"unit">)=>[x.category,x.productSlug,x.unit].join("|");
export function addDirectCart(raw:unknown,item:CartItem){const rows=safeDirectCart(raw),[next]=safeDirectCart([item]);if(!next)return rows;const match=rows.find(x=>cartKey(x)===cartKey(next));if(match){const total=Math.round((match.quantity+next.quantity)*1000)/1000;if(!validProductQuantity(match.category,match.productSlug,match.unit,total))return rows;return rows.map(x=>cartKey(x)===cartKey(next)?{...x,quantity:total}:x);}return rows.length<25?[...rows,next]:rows;}

export function changeDirectCartQuantity(raw:unknown,key:string,quantity:number){const rows=safeDirectCart(raw);if(!Number.isFinite(quantity)||quantity<.001||quantity>1000000||Math.abs(quantity*1000-Math.round(quantity*1000))>.00001)return rows;return rows.map(r=>cartKey(r)===key&&validProductQuantity(r.category,r.productSlug,r.unit,quantity)?{...r,quantity}:r);}

/** Reordering is a cart-only operation. Never silently truncate or partially import an order. */
export function mergePreviousMaterials(raw:unknown,previous:unknown):CartItem[]|null{
 if(!Array.isArray(previous)||!previous.length||previous.length>25)return null;
 const items=safeDirectCart(previous);
 if(items.length!==previous.length||items.some(i=>i.category==="aggregates"))return null;
 let rows=safeDirectCart(raw);
 for(const item of items){
  const existing=rows.find(r=>cartKey(r)===cartKey(item));
  if(existing){const total=Math.round((existing.quantity+item.quantity)*1000)/1000;
   if(!validProductQuantity(item.category,item.productSlug,item.unit,total))return null;
   rows=rows.map(r=>cartKey(r)===cartKey(item)?{...r,quantity:total}:r);
  }else{if(rows.length>=25)return null;rows=[...rows,item]}
 }
 return rows;
}
