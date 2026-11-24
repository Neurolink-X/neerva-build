"use client";
import Link from "next/link";
import {useEffect,useMemo,useRef,useState,type FormEvent} from "react";
import {operationsRequest} from "./operations-request";
type Design={slug:string;title:string;publication:string;reasons:string[]};
type Review={design_slug:string;status:string;note:string;version:number;updated_at:string};
type Data={designs:Design[];reviews:Review[]};
const states=["in_review","changes_requested","ready_for_professional_review","archived"];
const label=(s:string)=>s.replaceAll("_"," ");
export function StudioAdmin(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState(""),[revision,setRevision]=useState(0),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[query,setQuery]=useState(""),[filter,setFilter]=useState("all"),[page,setPage]=useState(0),[editing,setEditing]=useState("");
 const lock=useRef(false);
 useEffect(()=>{let active=true;void operationsRequest<Data>("/api/admin/design-reviews").then(d=>{if(active){setData(d);setError("")}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[revision]);
 const reviews=useMemo(()=>new Map((data?.reviews??[]).map(r=>[r.design_slug,r])),[data]);
 const designs=data?.designs??[];
 const matches=designs.filter(d=>(filter==="all"||(reviews.get(d.slug)?.status??"unreviewed")===filter)&&[d.title,d.slug,...d.reasons].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
 const pages=Math.max(1,Math.ceil(matches.length/8)),current=Math.min(page,pages-1);
 async function save(e:FormEvent<HTMLFormElement>,d:Design){e.preventDefault();if(lock.current)return;const f=new FormData(e.currentTarget);lock.current=true;setBusy(true);setError("");setNotice("");try{const result=await operationsRequest<{review:Review}>("/api/admin/design-reviews","PATCH",{slug:d.slug,status:String(f.get("status")),note:String(f.get("note")),version:reviews.get(d.slug)?.version??0});setData(old=>old?{...old,reviews:[...old.reviews.filter(r=>r.design_slug!==d.slug),result.review]}:old);setEditing("");setNotice("Review saved and audited.")}catch(e){setError(e instanceof Error?e.message:"Save failed.")}finally{lock.current=false;setBusy(false)}}
 return <section className="admin-box"><h2>Design review management</h2><p>Manage internal review tasks separately from public architectural approval. A review status never certifies a design or changes its public availability.</p><div className="admin-metrics">{[["Published",designs.filter(d=>d.publication==="published").length],["Unreviewed",designs.filter(d=>!reviews.has(d.slug)).length],["Professional review queue",data?.reviews.filter(r=>r.status==="ready_for_professional_review").length??0]].map(([k,v])=><div key={k}><small>{k}</small><strong>{data?v:"…"}</strong></div>)}</div>
 <div className="admin-inline"><Link href="/design-studio/road-planner">Plot planner</Link><Link href="/admin/studio-settings">Studio pricing</Link><button disabled={loading||busy} onClick={()=>{setLoading(true);setEditing("");setRevision(n=>n+1)}}>Refresh</button></div>
 <div className="admin-inline"><label>Find design<input value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/></label><label>Review status<select value={filter} onChange={e=>{setFilter(e.target.value);setPage(0)}}>{["all","unreviewed",...states].map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label></div>
 {error&&<p role="alert" className="admin-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {loading?<p>Loading reviews…</p>:<p>{matches.length} matching designs</p>}
 {matches.slice(current*8,current*8+8).map(d=>{const r=reviews.get(d.slug);return <article key={d.slug} className="admin-record"><h3>{d.title}</h3><p>Publication: {d.publication} · Review: {label(r?.status??"unreviewed")}</p><Link href={"/design-studio/library/"+d.slug}>Inspect concept</Link><details><summary>Publication requirements ({d.reasons.length})</summary><ul>{d.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></details>{r&&<><p>{r.note}</p><small>Updated {new Date(r.updated_at).toLocaleString("en-IN")} · version {r.version}</small></>}
 {editing===d.slug?<form className="catalog-admin-form" onSubmit={e=>void save(e,d)}><label>Review status<select name="status" defaultValue={r?.status??"in_review"}>{states.map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label><label>Review note<textarea name="note" defaultValue={r?.note??""} required minLength={10} maxLength={1000}/></label><button disabled={busy}>Save review</button><button type="button" disabled={busy} onClick={()=>setEditing("")}>Cancel</button></form>:<button disabled={busy} onClick={()=>setEditing(d.slug)}>Manage review</button>}</article>})}
 <div className="admin-inline"><button disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button><span>Page {current+1} of {pages}</span><button disabled={current+1>=pages} onClick={()=>setPage(current+1)}>Next</button></div><p>Public design publication still requires verified PlanModel, geometry, city rules, material cost evidence and licensed professional sign-off.</p></section>
}
