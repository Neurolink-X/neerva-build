import {requireDealer,apiData,apiFailed} from "@/modules/identity/server-auth";
import {parseOrderJson,failOrder} from "@/modules/orders/order-contract";
import {stockConfirmationEnabled,stockConfirmationInput,stockFailure} from "@/modules/orders/stock-confirmation";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 return apiData({enabled:stockConfirmationEnabled(process.env)});
}
export async function POST(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 if(!stockConfirmationEnabled(process.env))return failOrder(503,"Atomic stock confirmation is paused pending database release verification.");
 const parsed=stockConfirmationInput.safeParse(await parseOrderJson(request,4096));
 if(!parsed.success)return failOrder(400,"Select the exact SKU for every ordered line and confirm identity.");
 const {orderId,branchId,variantIds}=parsed.data;
 try{
  const {data,error}=await auth.client.rpc("neerva_confirm_reserved_order",{p_order:orderId,p_branch:branchId,p_mapping:variantIds});
  if(error){const f=stockFailure(error.code);return failOrder(f.status,f.message);}
  if(data!==true)return apiFailed();
  return apiData({confirmed:true,stockReserved:true,paymentTaken:false});
 }catch{return apiFailed();}
}
