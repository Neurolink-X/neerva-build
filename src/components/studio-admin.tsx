"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {legacyPublication,publishedDesigns} from "@/modules/studio/design-publication";
export function StudioAdmin(){
 const [query,setQuery]=useState(""),[filter,setFilter]=useState("all"),[page,setPage]=useState(0);
 const matches=useMemo(()=>legacyPublication.filter(x=>(filter==="all"||x.status===filter)&&[x.design.title,x.design.slug,...x.reasons].join(" ").toLowerCase().includes(query.trim().toLowerCase())),[query,filter]);
 const pages=Math.max(1,Math.ceil(matches.length/8)),current=Math.min(page,pages-1);
 return <section className="admin-box"><h2>Design publication queue</h2><div className="admin-metrics"><div><small>Published</small><strong>{publishedDesigns.length}</strong></div><div><small>Drafts</small><strong>{legacyPublication.length-publishedDesigns.length}</strong></div></div><p>Review concept geometry, cost disclosure, local building rules and licensed architect or engineer sign-off before publication.</p>
 <div className="admin-inline"><Link href="/design-studio/road-planner">Open plot planner →</Link><Link href="/admin/studio-settings">Manage Studio access & pricing →</Link></div>
 <div className="admin-inline"><label>Find design<input value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}} placeholder="Plot size, design or review requirement"/></label><label>Status<select value={filter} onChange={e=>{setFilter(e.target.value);setPage(0)}}>{["all",...new Set(legacyPublication.map(x=>x.status))].map(s=><option key={s}>{s}</option>)}</select></label></div>
 <p>{matches.length} matching designs</p>{matches.slice(current*8,current*8+8).map(x=><article key={x.design.slug} className="admin-record"><h3>{x.design.title}</h3><small>{x.status.toUpperCase()}</small><Link href={"/design-studio/library/"+x.design.slug}>Inspect concept →</Link><details><summary>Publication requirements ({x.reasons.length})</summary><ul>{x.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></details></article>)}
 <div className="admin-inline"><button disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button><span>Page {current+1} of {pages}</span><button disabled={current+1>=pages} onClick={()=>setPage(current+1)}>Next</button></div><p>Publication remains locked until verified professional review is available. This is a concept review directory, not certified architectural approval.</p></section>
}
