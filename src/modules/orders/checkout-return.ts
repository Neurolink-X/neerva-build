import {isMaterialCategory,isAllowedCategoryUnit} from "../catalog/category-units.ts";
export function safeCheckoutReturn(value:unknown):string|null{
 if(typeof value!=="string"||value.length>800||!value.startsWith("/checkout?")||/[\\\r\n]/.test(value))return null;
 const u=new URL(value,"https://checkout.invalid");if(u.origin!=="https://checkout.invalid"||u.pathname!=="/checkout"||u.hash)return null;
 const p=u.searchParams;if(p.get("cart")==="1")return "/checkout?cart=1";
 const category=p.get("category")??"",product=p.get("product")??"";if(!isMaterialCategory(category)||!/^[a-z0-9-]{1,100}$/.test(product))return null;
 const q=new URLSearchParams({category,product});const qty=Number(p.get("qty"));if(Number.isFinite(qty)&&qty>=.001&&qty<=1000000&&Math.abs(qty*1000-Math.round(qty*1000))<.00001)q.set("qty",String(qty));const unit=p.get("unit")??"";if(isAllowedCategoryUnit(category,unit))q.set("unit",unit);const pin=p.get("pin")??"";if(/^[1-9][0-9]{5}$/.test(pin))q.set("pin",pin);return "/checkout?"+q.toString();
}
