import {validProductQuantity} from "./category-units.ts";

export type PublicRate={category:string;slug:string;sku:string;unit:string;paise:number;city:string;prefix:string|null;min:number;until:string|null};
export type PublicOffer={id:string;title:string;terms:string;category:string;slug:string;sku:string;city:string;unit:string;prefix:string|null;min:number;basePaise:number;offerPaise:number;endsAt:string};
const record=(value:unknown):value is Record<string,unknown>=>typeof value==="object"&&value!==null&&!Array.isArray(value);
const text=(value:unknown):value is string=>typeof value==="string"&&value.trim().length>0;
const positiveMoney=(value:unknown):value is number=>typeof value==="number"&&Number.isSafeInteger(value)&&value>0;
const future=(value:unknown,now:number):value is string=>typeof value==="string"&&Number.isFinite(Date.parse(value))&&Date.parse(value)>now;
function common(value:Record<string,unknown>){
 return text(value.category)&&value.category!=="aggregates"&&text(value.slug)&&text(value.sku)&&text(value.unit)&&
 text(value.city)&&
 (value.prefix===null||typeof value.prefix==="string"&&/^\d{1,6}$/.test(value.prefix))&&
 typeof value.min==="number"&&validProductQuantity(value.category,value.slug,value.unit,value.min);
}
export function validPublicRate(value:unknown,now:number):value is PublicRate{
 return Number.isFinite(now)&&record(value)&&common(value)&&positiveMoney(value.paise)&&
 (value.until===null||future(value.until,now));
}
export function validPublicOffer(value:unknown,now:number):value is PublicOffer{
 return Number.isFinite(now)&&record(value)&&common(value)&&text(value.id)&&text(value.title)&&typeof value.terms==="string"&&
 positiveMoney(value.basePaise)&&positiveMoney(value.offerPaise)&&value.offerPaise<value.basePaise&&future(value.endsAt,now);
}
