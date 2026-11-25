import type {StudioProduct} from "./paid-products";
export type StudioOrderStatus={id:string;status:string;created_at:string;amount_paise:number};
export type StudioCheckoutStatus={product:StudioProduct;enabled:boolean;mode:"free"|"paid";paid:boolean;canUseReport:boolean;orders:StudioOrderStatus[];claimedOrderIds:string[];pricePaise:number};
const record=(v:unknown):v is Record<string,unknown>=>typeof v==="object"&&v!==null&&!Array.isArray(v);
const amount=(v:unknown)=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=0;
export function isStudioCheckoutStatus(v:unknown,product:StudioProduct):v is StudioCheckoutStatus{
 if(!record(v)||v.product!==product||typeof v.enabled!=="boolean"||typeof v.paid!=="boolean"||typeof v.canUseReport!=="boolean"||(v.mode!=="free"&&v.mode!=="paid")||!amount(v.pricePaise)||!Array.isArray(v.orders)||!Array.isArray(v.claimedOrderIds))return false;
 return v.orders.every(o=>record(o)&&typeof o.id==="string"&&o.id.length>0&&typeof o.status==="string"&&typeof o.created_at==="string"&&amount(o.amount_paise)&&(o.status!=="requested"||Number(o.amount_paise)>0))&&v.claimedOrderIds.every(id=>typeof id==="string");
}
