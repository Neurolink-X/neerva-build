"use client";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type RecordRow=Record<string,unknown>;
type Props={endpoint:string;title:string;description:string;arrays:{key:string;label:string;fields:string[]}[]};
const client=createNeervaBrowserClient();
function value(v:unknown):string{
 if(v==null)return "—";
 if(typeof v==="number")return Number.isFinite(v)?v.toLocaleString("en-IN"):"—";
 if(typeof v==="boolean")return v?"Yes":"No";
 if(typeof v==="string")return v.length>180?v.slice(0,177)+"…":v;
 if(Array.isArray(v))return v.length+" records";
 return "See details in your account";
}
export function SecureOperationsList({endpoint,title,description,arrays}:Props){
 const [data,setData]=useState<RecordRow|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(true);
 const load=useCallback(async(signal?:AbortSignal)=>{
   if(!client){setMessage("The dedicated Neerva account/database service is not configured.");setBusy(false);return;}
   setBusy(true);setMessage("");
   try{
     const session=await client.auth.getSession();
     const token=session.data.session?.access_token;
     if(!token){setMessage("Sign in with the required account role before opening this dashboard.");setData(null);return;}
     const response=await fetch(endpoint,{headers:{Authorization:"Bearer "+token},cache:"no-store",signal});
     const body=await response.json().catch(()=>({error:"The service returned an invalid response."})) as RecordRow;
     if(!response.ok){setMessage(typeof body.error==="string"?body.error:"The requested information is unavailable.");setData(null);return;}
     setData(body);
   }catch(err){if(signal?.aborted)return;setMessage("Could not load this view. Check your connection and retry.");setData(null);}
   finally{if(!signal?.aborted)setBusy(false)}
 },[endpoint]);
 useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load]);
 return <section className="neerva-ops-panel" aria-labelledby="neerva-ops-title" style={{padding:"20px",border:"1px solid #dbe3d8",borderRadius:16,background:"#fffdf9",maxWidth:"1100px"}}>
  <h2 id="neerva-ops-title" style={{fontSize:24}}>{title}</h2><p style={{lineHeight:1.6}}>{description}</p>
  <div style={{display:"flex",flexWrap:"wrap",gap:12,margin:"16px 0"}}>
   <button type="button" className="button button-outline" disabled={busy} onClick={()=>void load()}>{busy?"Checking…":"Refresh"}</button>
   <Link className="button button-outline" href="/account">Account access</Link>
  </div>
  {busy&&<p role="status">Loading protected records…</p>}
  {!busy&&message&&<p role="alert" style={{padding:12,borderRadius:8,background:"#fff0e6",color:"#7a3b20"}}>{message}</p>}
  {!busy&&data&&arrays.map(({key,label,fields})=>{
   const rows=Array.isArray(data[key])?data[key] as RecordRow[]:[];
   return <section key={key} style={{marginTop:24}} aria-label={label}><h3 style={{fontSize:20}}>{label}</h3>
    {!rows.length?<p>No records visible to your account.</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",minWidth:Math.max(380,fields.length*120),borderCollapse:"collapse"}}>
     <thead><tr>{fields.map(f=><th key={f} style={{padding:10,borderBottom:"1px solid #d6dfd5",textAlign:"left"}}>{f.replaceAll("_"," ")}</th>)}</tr></thead>
     <tbody>{rows.slice(0,100).map((r,i)=><tr key={typeof r.id==="string"?r.id:typeof r.tenant_id==="string"?r.tenant_id+"-"+i:i}>{fields.map(f=><td key={f} style={{padding:10,borderBottom:"1px solid #e9eee8",fontSize:13}}>{value(r[f])}</td>)}</tr>)}</tbody>
    </table></div>}
   </section>
  })}
 </section>;
}
