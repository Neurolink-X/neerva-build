"use client";
import {useSyncExternalStore} from "react";
import Link from "next/link";
const stages=[
["Plan before buying","योजना और मंजूरी","Record plot boundaries, family needs and budget. Obtain local approvals and coordinated architectural and structural drawings.","Approved drawings and written scope","planning"],
["Understand the ground","मिट्टी और नींव","Ask a qualified engineer to assess soil, groundwater and nearby foundations before excavation. Do not copy another house's footing.","Site assessment and approved foundation design","ground"],
["Build a safe structure","मजबूत ढांचा","Check reinforcement, cover, formwork and concrete against approved drawings before each pour. Record inspections and curing.","Engineer clearance before concealed work","structure"],
["Walls and weather protection","दीवार और नमी से सुरक्षा","Coordinate openings, masonry, roof drainage and waterproofing. Test wet areas before covering them.","Waterproofing test and masonry checks","envelope"],
["Water, electricity and ventilation","पानी, बिजली और हवा","Coordinate plumbing and electrical routes before plaster. Use qualified trades and test installations before concealment.","Pressure and electrical safety test records","services"],
["Finishes and purchasing","फिनिशिंग और खरीद","Compare written specifications, quantities, batch quality and installed cost. Approve a sample before bulk installation.","Sample approval and measured quantities","procurement"],
["Inspect and hand over","जांच और रखरखाव","Close defects, collect warranties, as-built drawings and maintenance instructions. Arrange required local completion approvals.","Signed inspection and handover record","handover"]
] as const;
const futures=[
["Build for heat and water stress","Shade, cross-ventilation, roof insulation, drainage and water-efficient fixtures are useful today. Evaluate future climate exposure with local data."],
["Digital twins and BIM","Coordinated digital models can expose service clashes and support quantity checks. A model is not proof of structural safety."],
["Off-site and modular construction","Factory-made assemblies may reduce site waste and improve consistency. Verify transport, connections, fire performance and local approval."],
["Lower-carbon materials","Compare verified environmental declarations, durability, local availability and structural suitability; do not substitute materials without approval."],
["Robotics and 3D printing","Emerging methods may change labour and fabrication. Require tested systems, inspection plans and code acceptance before adoption."],
["Smart, repairable homes","Plan accessible service routes, replaceable controls and manual overrides. Prefer interoperable systems and secure local operation."]
] as const;
const key="neerva-owner-learning-v1";
const eventName="neerva-owner-learning-change";
let memory="[]";
function subscribe(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener(eventName,callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener(eventName,callback)}}
function snapshot(){try{return localStorage.getItem(key)??memory}catch{return memory}}
function serverSnapshot(){return "[]"}
function parseProgress(raw:string):string[]{try{const value:unknown=JSON.parse(raw);return Array.isArray(value)?[...new Set(value.filter((x):x is string=>typeof x==="string"&&stages.some(s=>s[4]===x)))]:[]}catch{return []}}
export function AcademyStart(){const raw=useSyncExternalStore(subscribe,snapshot,serverSnapshot);const done=parseProgress(raw);function toggle(id:string){const current=parseProgress(snapshot());const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];memory=JSON.stringify(next);try{localStorage.setItem(key,memory)}catch{}window.dispatchEvent(new Event(eventName))}

return <><section className="academy-owner" id="owner-roadmap"><span className="eyebrow">START HERE · FIRST-TIME HOME BUILDERS</span><h2>Your house, one decision at a time.</h2><p>घर बनाने की शुरुआत यहां से करें। Follow this practical learning roadmap before spending money or approving site work.</p><progress max={stages.length} value={done.length} aria-label="Learning roadmap progress"/><p role="status">{done.length} of {stages.length} topics studied · not a construction approval</p><div className="academy-owner-grid">{stages.map(([title,hi,body,proof,id],i)=><article key={id}><span className="eyebrow">STEP {i+1}</span><h3>{title}</h3><p lang="hi">{hi}</p><p>{body}</p><p><strong>Ask for:</strong> {proof}</p><Link href={"/build-iq/handbook/"+id}>Learn this stage →</Link><label><input type="checkbox" checked={done.includes(id)} onChange={()=>toggle(id)}/> Mark as studied</label></article>)}</div><p><strong>Safety rule:</strong> Never use an educational example as a structural design, excavation instruction or electrical specification. Follow current local rules and qualified professional advice.</p></section><section className="academy-owner" id="future-building"><span className="eyebrow">FUTURE OF HOMES · 2036 HORIZON</span><h2>Build for tomorrow, not just today.</h2><p>Explore durable principles and emerging methods. These are possible directions, not guaranteed predictions or approved construction systems.</p><div className="academy-owner-grid">{futures.map(([title,body])=><article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div><p>Verify current standards and local approvals before adopting any new system. <a href="https://www.bis.gov.in/">BIS</a> · <a href="https://beeindia.gov.in/">BEE</a></p></section></>}
