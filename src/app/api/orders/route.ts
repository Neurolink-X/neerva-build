import {requireAuth,notReady} from "@/modules/identity/server-auth";
import {springOrders} from "@/modules/orders/backend";
export const dynamic="force-dynamic";
export async function GET(request:Request){const auth=await requireAuth(request);if(auth instanceof Response)return auth;return await springOrders(request,"")??notReady()}
export async function POST(request:Request){const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 const type=request.headers.get("content-type")??"";
 if(!type.includes("application/json"))return Response.json({error:"JSON required"},{status:415});
 try{const body=await request.json();const upstream=await springOrders(request,"",body);return upstream??notReady()}catch{return Response.json({error:"Invalid order request"},{status:400})}}
