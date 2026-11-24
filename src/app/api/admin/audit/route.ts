import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const url=new URL(request.url),raw=Number(url.searchParams.get("page")??0),page=Number.isInteger(raw)&&raw>=0&&raw<=1000?raw:0;
 const filter=url.searchParams.get("action")??"";
 if(filter&&!/^[a-zA-Z0-9_.:-]{1,80}$/.test(filter))return Response.json({error:"Invalid audit filter."},{status:400});
 try{let q=auth.client.from("audit_logs").select("id,actor_id,action,object_type,object_id,created_at",{count:"exact"}).order("created_at",{ascending:false}).order("id",{ascending:false});
 if(filter)q=q.eq("action",filter);
 const r=await q.range(page*50,page*50+49);
 if(r.error)return apiFailed();return apiData({events:r.data??[],page,total:r.count??0});
 }catch{return apiFailed()}
}
