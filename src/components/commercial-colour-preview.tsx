"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {buildingPurposes,buildingStarter,generateBuildingConcepts,purposeDetails,type BuildingPurpose,type BuildingConcept} from "@/modules/studio/building-purpose";
import {defaultFinishScheme,finishPresets,type FinishScheme} from "@/modules/studio/finish-model";
import {CommercialFront} from "./commercial-front";
const advice:Record<BuildingPurpose,string>={shops:"Keep entrances legible and choose washable frontage finishes.",mall:"Use a consistent facade palette and verify glare and maintenance requirements.",restaurant:"Use welcoming tones and confirm washable finishes near food preparation.",school:"Choose calm colours with clear wayfinding and verify finish safety.",rental:"Choose easy-to-maintain neutral shades and durable common-area finishes."};
function Sample({plan}:{plan:BuildingConcept}){
 const [scheme,setScheme]=useState<FinishScheme>(()=>defaultFinishScheme({kind:"commercial",plan}));
 const fields=[["exterior","Main wall"],["accent","Accent band"],["glass","Glass tint"]] as const;
 return <><CommercialFront plan={plan} scheme={scheme}/><div className="commercial-colour-fields">{fields.map(([field,label])=><label key={field}>{label}<input aria-label={label} type="color" value={scheme[field]} onChange={e=>setScheme(s=>({...s,[field]:e.target.value}))}/></label>)}</div><div className="commercial-colour-palettes" role="group" aria-label="Suggested finish palettes">{(["shops","restaurant","school","mall","rental"] as const).map(p=><button type="button" key={p} onClick={()=>setScheme(s=>({...s,exterior:finishPresets[p].exterior,accent:finishPresets[p].accent,glass:finishPresets[p].glass}))}><span aria-hidden="true" style={{background:finishPresets[p].exterior,borderColor:finishPresets[p].accent}}/>{purposeDetails[p].title}</button>)}</div><button type="button" className="button button-outline" onClick={()=>setScheme(defaultFinishScheme({kind:"commercial",plan}))}>Reset colours</button></>;
}
export default function CommercialColourPreview(){
 const [purpose,setPurpose]=useState<BuildingPurpose>("shops");
 const plan=useMemo(()=>generateBuildingConcepts(buildingStarter(purpose),1).plans[0],[purpose]);
 return <section className="commercial-colour-preview" aria-label="Commercial colour preview"><h2>Explore commercial colours</h2><p>Choose one example building and change its finishes instantly. The illustration is a generated concept, not a property photograph.</p><label>Building sample <select value={purpose} onChange={e=>setPurpose(e.target.value as BuildingPurpose)}>{buildingPurposes.map(p=><option key={p} value={p}>{purposeDetails[p].title}</option>)}</select></label>{plan?<Sample key={plan.id} plan={plan}/>:<p role="status">No valid example is available. Use the building planner.</p>}<p>{advice[purpose]} Digital shades are approximate.</p><Link href={"/design-studio/buildings?purpose="+purpose} prefetch={false}>Plan this building on your own plot →</Link></section>;
}
