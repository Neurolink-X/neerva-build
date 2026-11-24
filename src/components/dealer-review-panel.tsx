"use client";
import {useEffect,useState,useRef,type FormEvent} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type Application={id:string;legal_business_name:string;shop_city:string;status:string;gstin_verification:string;decision_reason:string|null};
const actions:Record<string,string[]>={submitted:["verify_gstin","verify_photo","request_changes","approve","reject"],approved:["suspend"],suspended:["reactivate"]};
async function api(method="GET",body?:unknown){
 const token=(await createNeervaBrowserClient()?.auth.getSession())?.data.session?.access_token;
 if(!token)throw Error("Sign in as an administrator.");
 const res=await fetch("/api/admin/dealers",{method,cache:"no-store",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
 const data=await res.json();if(!res.ok)throw Error(data.error??"Request failed");return data;
}
export function DealerReviewPanel(){
 const [rows,setRows]=useState<Application[]>([]),[query,setQuery]=useState(""),[filter,setFilter]=useState("all"),[error,setError]=useState(""),[notice,setNotice]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0);
 const lock=useRef(false);
 useEffect(()=>{let active=true;void api().then(d=>{if(active){setRows(d.applications??[]);setError("")}}).catch(e=>{if(active){setRows([]);setError(String(e.message))}}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[revision]);
 async function review(e:FormEvent<HTMLFormElement>,row:Application){
 e.preventDefault();if(lock.current)return;const f=new FormData(e.currentTarget),action=String(f.get("action")),reason=String(f.get("reason"));
 if(!window.confirm("Confirm "+action.replaceAll("_"," ")+" for "+row.legal_business_name+"?"))return;
 lock.current=true;setBusy(true);setNotice("");setError("");
 try{await api("PATCH",{id:row.id,expected:row.status,action,reason});setNotice("Review saved and audited.");setLoading(true);setRevision(n=>n+1)}
 catch(e){setError(e instanceof Error?e.message:"Review failed")}finally{lock.current=false;setBusy(false)}
 }
 const visible=rows.filter(r=>(filter==="all"||r.status===filter)&&[r.legal_business_name,r.shop_city,r.id].join(" ").toLowerCase().includes(query.toLowerCase()));
 return <section className="admin-box"><h2>Dealer decisions</h2><p>Verify GST registration and every shop photo against genuine evidence before approval. Approval also requires categories, service pincodes and an approved branch. Never verify unseen evidence.</p><div className="admin-inline"><label>Search<input value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Status<select value={filter} onChange={e=>setFilter(e.target.value)}>{["all","draft","submitted","changes_requested","approved","rejected","suspended"].map(s=><option key={s}>{s}</option>)}</select></label><button disabled={loading||busy} onClick={()=>{setLoading(true);setRevision(n=>n+1)}}>Refresh</button></div>{error&&<p role="alert" className="admin-error">{error}</p>}{notice&&<p role="status">{notice}</p>}{loading?<p>Loading…</p>:!visible.length?<p>No matching applications.</p>:visible.map(r=><article className="admin-record" key={r.id}><h3>{r.legal_business_name}</h3><p>{r.shop_city} · {r.status} · GST {r.gstin_verification}</p><small>{r.id}</small>{r.decision_reason&&<p>{r.decision_reason}</p>}{actions[r.status]?.length>0&&<form className="catalog-admin-form" onSubmit={e=>void review(e,r)}><label>Decision<select name="action">{actions[r.status].map(a=><option key={a} value={a}>{a.replaceAll("_"," ")}</option>)}</select></label><label>Review evidence / reason<textarea name="reason" required minLength={10} maxLength={500}/></label><button disabled={busy||loading}>Confirm decision</button></form>}</article>)}</section>
}
