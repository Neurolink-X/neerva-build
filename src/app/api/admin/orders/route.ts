import {requireAdmin,notReady} from "@/modules/identity/server-auth";
import {springOrders} from "@/modules/orders/backend";
export const dynamic="force-dynamic";
/** Backend owns actual order persistence and allocation. If it is not
 * configured, fail closed. Never synthesize orders from browser carts/RFQs.
 * Downstream /v1/orders/admin must verify the passed user JWT and admin role.
 */
export async function GET(request:Request){
 const auth=await requireAdmin(request);
 if(auth instanceof Response)return auth;
 return await springOrders(request,"/admin")??notReady();
}
