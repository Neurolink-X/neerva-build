import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {studioPaymentEnabled} from "@/modules/studio/paid-products";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const started=performance.now();const {data,error}=await auth.client.rpc("neerva_admin_snapshot");if(error||!data)return apiFailed();
 const response=apiData({...data,paymentInfrastructureEnabled:studioPaymentEnabled(process.env),scope:"RLS-visible records",updatedAt:new Date().toISOString()});
 response.headers.set("Server-Timing","snapshot;dur="+Math.round(performance.now()-started));return response;
 }catch{return apiFailed()}
}
