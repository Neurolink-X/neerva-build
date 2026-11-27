"use client";
import {useState} from "react";
import {calculateConceptDemand,type DemandInputs} from "@/modules/studio/building-demand";
const fields=[["people","Assumed people"],["deadKpa","Uniform dead load assumption (kPa)"],["liveKpa","Uniform live load assumption (kPa)"],["powerWPerM2","Electrical density assumption (W/m²)"],["waterLPerPersonDay","Water assumption (L/person/day)"],["ventLpsPerPerson","Outdoor air assumption (L/s/person)"]] as const;
type Key=typeof fields[number][0];
export function BuildingDemandWorksheet({areaSqFt}:{areaSqFt:number}){
 const [values,setValues]=useState<Record<Key,string>>({people:"",deadKpa:"",liveKpa:"",powerWPerM2:"",waterLPerPersonDay:"",ventLpsPerPerson:""});
 const input=Object.fromEntries(fields.map(([key])=>[key,values[key].trim()===""?NaN:Number(values[key])])) as Omit<DemandInputs,"areaSqFt">;
 const result=calculateConceptDemand({...input,areaSqFt});
 const num=(n:number)=>n.toLocaleString("en-IN",{maximumFractionDigits:2});
 return <details><summary>Engineering assumptions worksheet (optional)</summary><p>Enter values supplied by your qualified engineering team. No code minimums or default design loads are assumed. The calculations multiply your assumptions by selected floor concept area or people; they are not equipment sizing, structural analysis or approval.</p><div className="purpose-form">{fields.map(([key,label])=><label key={key}>{label}<input type="number" min="0" step={key==="people"?1:"any"} value={values[key]} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/></label>)}</div>{result?<div className="purpose-metrics">{[[num(result.unfactoredDeadKn)+" kN","Assumed uniform dead load total"],[num(result.unfactoredLiveKn)+" kN","Assumed uniform live load total"],[num(result.assumedElectricalKw)+" kW","Assumed electrical demand"],[num(result.assumedWaterLPerDay)+" L/day","Assumed water demand"],[num(result.assumedOutdoorAirLps)+" L/s","Assumed outdoor air volume flow"]].map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>:<p role="status">Complete all six assumptions to show arithmetic results.</p>}<p>Not for selecting columns, foundations, circuits, water tanks, ducts, or safety capacity.</p></details>
}
