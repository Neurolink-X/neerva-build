import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const days=Number(new URL(request.url).searchParams.get("days")??30);
 if(![7,30,90].includes(days))return Response.json({error:"Choose a 7, 30 or 90 day period."},{status:400});
 try{const r=await auth.client.rpc("neerva_admin_business_metrics",{p_days:days});return r.error||!r.data?apiFailed():apiData(r.data)}catch{return apiFailed()}
}
