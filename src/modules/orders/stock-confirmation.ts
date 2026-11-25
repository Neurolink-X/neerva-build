import {z} from "zod";
export const stockConfirmationEnabled=(env:Record<string,string|undefined>)=>env.NEERVA_ATOMIC_STOCK_CONFIRMATION==="true";
export const stockConfirmationInput=z.object({orderId:z.string().uuid(),branchId:z.string().uuid(),variantIds:z.array(z.string().uuid()).min(1).max(30),exactSkuConfirmed:z.literal(true)}).strict();
export function stockFailure(code:string|undefined):{status:number;message:string}{
 if(code==="42501")return {status:403,message:"This order or branch is not assigned to your account."};
 if(["23514","23505","22P02","22003"].includes(code??""))return {status:409,message:"Stock, exact SKU, coverage or order state changed. Refresh and verify all lines before retrying."};
 return {status:503,message:"Stock confirmation is not available or the result is uncertain. Refresh orders before retrying."};
}
