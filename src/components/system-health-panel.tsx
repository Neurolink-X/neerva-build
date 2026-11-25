"use client";
import {useEffect,useState,useRef,type FormEvent} from "react";
import {operationsRequest} from "./operations-request";
import {incidentRefreshDelay,canRefreshIncidents,countActiveIncidents} from "@/modules/observability/incident-refresh";
type Incident={id:string;module:string;severity:string;error_code:string;safe_summary:string;impact:string;route:string;status:string;occurrence_count:number;last_seen_at:string};
export function SystemHealthPanel(){
 const [rows,setRows]=useState<Incident[]>([]),[query,setQuery]=useState(""),[filter,setFilter]=useState("all"),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[lastSync,setLastSync]=useState<number|null>(null);
 const lock=useRef(false),refresh=useRef<()=>void>(()=>{}),requestLock=useRef(false);
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
    if(active){setRows(d.incidents);setError("");setLastSync(Date.now());failures=0;}
   }catch(e){if(active){setRows([]);setError(e instanceof Error?e.message:"Incident monitoring unavailable.");failures++;}}
   finally{requestLock.current=false;if(active){setLoading(false);schedule()}}
  }
  function wake(){if(document.visibilityState==="visible"&&navigator.onLine!==false&&!requestLock.current)void poll();else schedule()}
  function offline(){clearTimeout(timer);if(active){setRows([]);setError("Connection offline. Incident monitoring paused.");setLoading(false)}}
  refresh.current=wake;
  document.addEventListener("visibilitychange",wake);window.addEventListener("online",wake);window.addEventListener("offline",offline);window.addEventListener("neerva:incident-recorded",wake);
  if(navigator.onLine===false)offline();else void poll();
  return()=>{active=false;clearTimeout(timer);refresh.current=()=>{};document.removeEventListener("visibilitychange",wake);window.removeEventListener("online",wake);window.removeEventListener("offline",offline);window.removeEventListener("neerva:incident-recorded",wake)};
 },[]);
 async function save(e:FormEvent<HTMLFormElement>,r:Incident){e.preventDefault();if(lock.current)return;const f=new FormData(e.currentTarget);lock.current=true;setBusy(true);setNotice("");try{await operationsRequest("/api/admin/system-incidents","PATCH",{id:r.id,expected:r.status,status:String(f.get("status")),reason:String(f.get("reason"))});setNotice("Incident review saved and audited.");}catch(e){setNotice(e instanceof Error?e.message:"Review failed.");}finally{lock.current=false;setBusy(false);refresh.current()}}
 const visible=rows.filter(r=>(filter==="all"||r.status===filter)&&[r.module,r.error_code,r.safe_summary,r.route].join(" ").toLowerCase().includes(query.toLowerCase()));
 const counts=countActiveIncidents(rows);
 return <section className="admin-box"><h2>Platform incident centre</h2><p>Runtime monitoring runs independently of weekly GitHub checks. Latest 100 recorded incidents; browser reports remain unverified until investigated. No raw passwords, tokens, request bodies or stack traces are collected.</p><div role="status"><strong>{loading?"Connecting to incident monitoring…":error?"Incident monitoring unavailable":lastSync?"Live incident feed · refreshes about every 15 seconds while visible":"Waiting for first successful check"}</strong>{lastSync&&<p>Last successful sync: {new Date(lastSync).toLocaleString("en-IN")}</p>}{!error&&!loading&&<p>{counts.active} active incidents · {counts.urgent} urgent/error incidents in latest 100 records.</p>}</div><div className="admin-inline"><label>Search<input value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Status<select value={filter} onChange={e=>setFilter(e.target.value)}>{["all","open","investigating","resolved","ignored"].map(s=><option key={s}>{s}</option>)}</select></label><button disabled={loading||busy} onClick={()=>refresh.current()}>Refresh</button></div>{error&&<p role="alert" className="admin-error">{error} Monitoring failure does not disable normal website operations.</p>}{notice&&<p role="status">{notice}</p>}{loading?<p>Loading…</p>:error?<p>Incident data is not currently verified. Check again when the connection returns.</p>:!visible.length?<p>No matching recorded incidents. This is not proof of zero errors.</p>:visible.map(r=><article className="admin-record" key={r.id}><h3>{r.module} · {r.error_code}</h3><p>{r.severity} · {r.status} · {r.occurrence_count} occurrences</p><p>{r.safe_summary}</p><p>{r.impact}</p><small>{r.route} · {new Date(r.last_seen_at).toLocaleString("en-IN")}</small><form className="catalog-admin-form" onSubmit={e=>void save(e,r)}><label>Status<select name="status" key={r.status} defaultValue={r.status}>{["open","investigating","resolved","ignored"].map(s=><option key={s}>{s}</option>)}</select></label><label>Investigation notes<textarea name="reason" required minLength={10} maxLength={500}/></label><button disabled={busy||loading}>Save incident review</button></form></article>)}</section>
}
