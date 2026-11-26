import {isMaterialCategory,validProductQuantity,productUnits} from "../catalog/category-units.ts";
export function safeCheckoutReturn(value:unknown):string|null{
 if(typeof value!=="string"||value.length>800||!value.startsWith("/checkout?")||/[\\\r\n]/.test(value))return null;
 const u=new URL(value,"https://checkout.invalid");if(u.origin!=="https://checkout.invalid"||u.pathname!=="/checkout"||u.hash)return null;
 const p=u.searchParams;if(p.get("cart")==="1")return "/checkout?cart=1";
 const category=p.get("category")??"",product=p.get("product")??"";if(!isMaterialCategory(category)||!/^[a-z0-9-]{1,100}$/.test(product))return null;
 const q=new URLSearchParams({category,product});const qty=Number(p.get("qty")),unit=p.get("unit")??"";const allowed=productUnits(category,product);if(allowed.some(u=>u===unit))q.set("unit",unit);if(validProductQuantity(category,product,unit||allowed[0]||"",qty))q.set("qty",String(qty));const pin=p.get("pin")??"";if(/^[1-9][0-9]{5}$/.test(pin))q.set("pin",pin);return "/checkout?"+q.toString();
}
