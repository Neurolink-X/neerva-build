import {requireAuth,notReady} from "@/modules/identity/server-auth";
import {springOrders} from "@/modules/orders/backend";
export const dynamic="force-dynamic";
export async function GET(request:Request){const auth=await requireAuth(request);if(auth instanceof Response)return auth;return await springOrders(request,"")??notReady()}
export async function POST(request:Request){const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 const type=request.headers.get("content-type")??"";
 if(!type.toLowerCase().includes("application/json"))return Response.json({error:"JSON required"},{status:415,headers:{"Cache-Control":"private, no-store"}});
 const maxBytes=16_384,length=Number(request.headers.get("content-length")??0);
 if(!Number.isFinite(length)||length>maxBytes)return Response.json({error:"Order request exceeds size limit"},{status:413,headers:{"Cache-Control":"private, no-store"}});
 try{
  const text=await request.text();
  if(Buffer.byteLength(text,"utf8")>maxBytes)return Response.json({error:"Order request exceeds size limit"},{status:413,headers:{"Cache-Control":"private, no-store"}});
  const body:unknown=JSON.parse(text);
  if(!body||typeof body!=="object"||Array.isArray(body))return Response.json({error:"An order object is required"},{status:400,headers:{"Cache-Control":"private, no-store"}});
  const upstream=await springOrders(request,"",body);
  return upstream??notReady();
 }catch{return Response.json({error:"Invalid order request"},{status:400,headers:{"Cache-Control":"private, no-store"}})}}
