import {studioProducts,isStudioProduct,type StudioProduct} from "./paid-products.ts";
export type StudioAccessMode="free"|"paid";
export type StudioSetting={
 product:StudioProduct;mode:StudioAccessMode;pricePaise:number;checkoutEnabled:boolean;
 published:boolean;freePreviewCount:number;version:number;
};
export const baseStudioConfig=(product:StudioProduct):StudioSetting=>({
 product,mode:"paid",pricePaise:studioProducts[product].pricePaise,
 checkoutEnabled:false,published:false,freePreviewCount:4,version:0
});
export function parseStudioConfig(data:unknown):StudioSetting|null{
 if(typeof data!=="object"||data===null)return null;
 const x=data as Record<string,unknown>;
 if(!isStudioProduct(x.product_code)||!["free","paid"].includes(String(x.access_mode))||
  !Number.isSafeInteger(x.price_paise)||Number(x.price_paise)<1000||Number(x.price_paise)>2000000||
  !Number.isInteger(x.free_preview_count)||Number(x.free_preview_count)<1||Number(x.free_preview_count)>24||
  typeof x.checkout_enabled!=="boolean"||typeof x.is_published!=="boolean")return null;
 return {product:x.product_code,mode:x.access_mode as StudioAccessMode,pricePaise:Number(x.price_paise),
  checkoutEnabled:x.checkout_enabled,published:x.is_published,
  freePreviewCount:Number(x.free_preview_count),version:Number(x.version)||1};
}
export function permittedStudioReport(config:StudioSetting,paid:boolean):boolean{
 return config.published&&(config.mode==="free"||paid);
}
export function availableCheckout(config:StudioSetting,paymentGate:boolean,paid:boolean):boolean{
 return config.published&&config.mode==="paid"&&config.checkoutEnabled&&paymentGate&&!paid;
}
