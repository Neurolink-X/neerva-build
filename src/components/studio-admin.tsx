"use client";
import Link from "next/link";
import {legacyPublication,publishedDesigns} from "@/modules/studio/design-publication";
export function StudioAdmin(){
 return <section style={{maxWidth:1100,margin:"auto",padding:20,background:"#fffdf8",border:"1px solid #d7e0d5",borderRadius:16}}>
  <h1>Design publication queue</h1>
  <p><strong>{publishedDesigns.length} published</strong> · {legacyPublication.length-publishedDesigns.length} drafts. No design becomes published merely by adding a facade colour, changing its name, or creating a new UI card.</p>
  <p>Each proposed publication requires one canonical PlanModel, geometry/circulation tests, an independently reviewed city setback and FAR policy, unique structural fingerprint and signed architect/engineer review. There is no authorized publish control in this preview.</p>
  <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
   <thead><tr><th scope="col" style={{textAlign:"left",padding:10}}>Design</th><th scope="col" style={{textAlign:"left",padding:10}}>Status</th><th scope="col" style={{textAlign:"left",padding:10}}>Why draft</th></tr></thead>
   <tbody>{legacyPublication.map(x=><tr key={x.design.slug} style={{borderTop:"1px solid #d7e0d5"}}>
    <td style={{padding:10}}><Link href={"/design-studio/library/"+x.design.slug}>{x.design.title}</Link></td>
    <td style={{padding:10}}>{x.status.toUpperCase()}</td>
    <td style={{padding:10}}>{x.reasons.slice(0,3).join("; ")}</td>
   </tr>)}</tbody></table></div>
  <p>Draft does not mean structurally verified. Concept only. Verify with a licensed architect/engineer and local authority approval.</p>
 </section>
}