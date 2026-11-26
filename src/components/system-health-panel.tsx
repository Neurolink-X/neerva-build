"use client";
import {useEffect,useState,useRef,type FormEvent} from "react";
import {incidentAdvice} from "@/modules/observability/error-guidance";
import {ServiceDiagnostics} from "./service-diagnostics";
import {operationsRequest} from "./operations-request";
import {incidentRefreshDelay,canRefreshIncidents,countActiveIncidents} from "@/modules/observability/incident-refresh";
type Incident={id:string;module:string;severity:string;error_code:string;safe_summary:string;impact:string;route:string;status:string;occurrence_count:number;last_seen_at:string;first_seen_at?:string;last_trace_id?:string|null};
export function SystemHealthPanel(){
 const [rows,setRows]=useState<Incident[]>([]),[query,setQuery]=useState(""),[filter,setFilter]=useState("all"),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[lastSync,setLastSync]=useState<number|null>(null);
 const lock=useRef(false),refresh=useRef<()=>void>(()=>{}),requestLock=useRef(false),editing=useRef(new Set<string>()); const [dirty,setDirty]=useState(0); function mark(id:string){editing.current.add(id);setDirty(editing.current.size)} function clear(id:string){editing.current.delete(id);setDirty(editing.current.size);refresh.current()}
 useEffect(()=>{
  let active=true,failures=0,timer:ReturnType<typeof setTimeout>|undefined;
  function schedule(){clearTimeout(timer);if(active&&document.visibilityState==="visible"&&navigator.onLine!==false)timer=setTimeout(()=>void poll(),incidentRefreshDelay(failures))}
  async function poll(){
   clearTimeout(timer);
   if(!active)return;
   if(!canRefreshIncidents(document.visibilityState==="visible",navigator.onLine!==false,lock.current||requestLock.current)){schedule();return}
   requestLock.current=true;
   try{
    const d=await operationsRequest<{incidents:Incident[]}>("/api/admin/system-incidents");
    if(!Array.isArray(d.incidents))throw Error("Incident response unavailable.");
    if(active){if(editing.current.size===0)setRows(d.incidents);setError("");setLastSync(Date.now());failures=0;}
   }catch(e){if(active){if(!editing.current.size)setRows([]);setError(e instanceof Error?e.message:"Incident monitoring unavailable.");failures++;}}
   finally{requestLock.current=false;if(active){setLoading(false);schedule()}}
  }
  function wake(){if(document.visibilityState==="visible"&&navigator.onLine!==false&&!requestLock.current)void poll();else schedule()}
  function offline(){clearTimeout(timer);if(active){if(!editing.current.size)setRows([]);setError("Connection offline. Incident monitoring paused.");setLoading(false)}}
  refresh.current=wake;
  document.addEventListener("visibilitychange",wake);window.addEventListener("online",wake);window.addEventListener("offline",offline);window.addEventListener("neerva:incident-recorded",wake);
  if(navigator.onLine===false)offline();else void poll();
  return()=>{active=false;clearTimeout(timer);refresh.current=()=>{};document.removeEventListener("visibilitychange",wake);window.removeEventListener("online",wake);window.removeEventListener("offline",offline);window.removeEventListener("neerva:incident-recorded",wake)};
 },[]);
 async function save(e:FormEvent<HTMLFormElement>,r:Incident){e.preventDefault();if(lock.current)return;const form=e.currentTarget;const f=new FormData(form);lock.current=true;setBusy(true);setNotice("");try{await operationsRequest("/api/admin/system-incidents","PATCH",{id:r.id,expected:r.status,status:String(f.get("status")),reason:String(f.get("reason"))});editing.current.delete(r.id);setDirty(editing.current.size);form.reset();setNotice("Incident review saved and audited.");}catch(e){setNotice("Review not confirmed: "+(e instanceof Error?e.message:"Review failed."));}finally{lock.current=false;setBusy(false);refresh.current()}}
 const visible=rows.filter(r=>(filter==="all"||r.status===filter)&&[r.module,r.error_code,r.safe_summary,r.route].join(" ").toLowerCase().includes(query.toLowerCase()));
 const counts=countActiveIncidents(rows);
 return <section className="admin-box"><h2>Platform incident centre</h2><ServiceDiagnostics/><p>Runtime monitoring runs independently of weekly GitHub checks. Latest 100 recorded incidents; browser reports remain unverified until investigated. No raw passwords, tokens, request bodies or stack traces are collected.</p><div role="status"><strong>{loading?"Connecting to incident monitoring…":error?"Incident monitoring unavailable":lastSync?"Live incident feed · refreshes about every 15 seconds while visible":"Waiting for first successful check"}</strong>{lastSync&&<p>Last successful sync: {new Date(lastSync).toLocaleString("en-IN")}</p>}{!error&&!loading&&<p>{counts.active} active incidents · {counts.urgent} urgent/error incidents in latest 100 records.</p>}</div><div className="admin-inline"><label>Search<input disabled={dirty>0} value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Status<select disabled={dirty>0} value={filter} onChange={e=>setFilter(e.target.value)}>{["all","open","investigating","resolved","ignored"].map(s=><option key={s}>{s}</option>)}</select></label><button disabled={loading||busy||dirty>0} onClick={()=>refresh.current()}>Refresh</button></div>{dirty>0&&<p role="status">Incident list updates paused while editing. Connection checks continue; save or discard your draft to resume list updates.</p>}{error&&<p role="alert" className="admin-error">{error} Monitoring failure does not disable normal website operations.</p>}{notice&&<p role={notice.startsWith("Review not confirmed")?"alert":"status"}>{notice}</p>}{loading?<p>Loading…</p>:error&&!dirty?<p>Incident data is not currently verified. Check again when the connection returns.</p>:!visible.length?<p>No matching recorded incidents. This is not proof of zero errors.</p>:visible.map(r=><article className="admin-record" key={r.id}><h3>{r.module} · {r.error_code}</h3><p>{r.severity} · {r.status} · {r.occurrence_count} occurrences</p><p>{r.safe_summary}</p><p>{r.impact}</p><small>{r.route} · Last seen {new Date(r.last_seen_at).toLocaleString("en-IN")}{r.first_seen_at?" · First seen "+new Date(r.first_seen_at).toLocaleString("en-IN"):""}</small>{r.last_trace_id&&<p>Trace reference: <code>{r.last_trace_id}</code></p>}<details><summary>Possible cause and recommended solution</summary><p>{incidentAdvice(r.error_code,r.module).cause}</p><ol>{incidentAdvice(r.error_code,r.module).checks.map(step=><li key={step}>{step}</li>)}</ol><p><strong>Safe recovery:</strong> {incidentAdvice(r.error_code,r.module).safety}</p><p>Suggested checks, not a confirmed root cause or completed repair.</p></details><form className="catalog-admin-form" onChange={()=>mark(r.id)} onSubmit={e=>void save(e,r)}><label>Status<select name="status" key={r.status} defaultValue={r.status}>{["open","investigating","resolved","ignored"].map(s=><option key={s}>{s}</option>)}</select></label><label>Investigation notes<textarea name="reason" required minLength={10} maxLength={500}/></label><button disabled={busy||loading||!!error}>Save incident review</button><button type="button" disabled={busy} onClick={e=>{e.currentTarget.form?.reset();clear(r.id)}}>Discard draft</button></form></article>)}</section>
}
