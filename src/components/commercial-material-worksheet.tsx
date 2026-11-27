"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import type {BuildingConcept} from "@/modules/studio/building-purpose";
import {commercialMaterialBasis,commercialFinishQuantities} from "@/modules/studio/commercial-material-basis";
import {reviewedQuoteHref} from "@/modules/studio/project-exchange";
export function CommercialMaterialWorksheet({plan}:{plan:BuildingConcept}){
 const basis=useMemo(()=>commercialMaterialBasis(plan),[plan]);
 const [scope,setScope]=useState("all"),[coverage,setCoverage]=useState(""),[tileCoverage,setTileCoverage]=useState(""),[coats,setCoats]=useState(2),[faces,setFaces]=useState<1|2>(1),[paintWaste,setPaintWaste]=useState(""),[tileWaste,setTileWaste]=useState(""),[reviewed,setReviewed]=useState(false);
 if(!basis)return <p role="alert">Commercial material measurement unavailable for invalid geometry.</p>;
 const rows=scope==="all"?basis.floors:basis.floors.filter(r=>String(r.floor)===scope);
 const sums=rows.reduce((s,r)=>({floorSqFt:s.floorSqFt+r.floorSqFt,faceSqFt:s.faceSqFt+r.faceSqFt,grossWallM3:s.grossWallM3+r.grossWallM3,grossSlabM3:s.grossSlabM3+r.grossSlabM3}),{floorSqFt:0,faceSqFt:0,grossWallM3:0,grossSlabM3:0});
 const num=(s:string)=>s.trim()===""?NaN:Number(s);
 const amounts=commercialFinishQuantities({...sums,paintFaces:faces,coverageM2PerL:num(coverage),coats,paintWastePercent:num(paintWaste),tileCoverageSqFtPerBox:num(tileCoverage),tileWastePercent:num(tileWaste)});
 const paint=reviewed&&amounts?reviewedQuoteHref("paint","litre",amounts.paintLitres,"Commercial concept paint — verify exposed faces, product coverage and substrate"):null;
 const tiles=reviewed&&amounts?reviewedQuoteHref("tiles","box",amounts.tileBoxes,"Commercial concept tiles — verify usable area, pack coverage and product"):null;
 const fmt=(n:number)=>n.toLocaleString("en-IN",{maximumFractionDigits:2});
 return <details><summary>Commercial building quantity worksheet</summary>
 <p>Concept geometry measurement only. Wall volumes include possible junction overlaps; slab volume uses illustrative thickness. Neither is a concrete, brick, cement or reinforcement order quantity.</p>
 <label>Measurement scope <select value={scope} onChange={e=>{setScope(e.target.value);setReviewed(false)}}><option value="all">All floors</option>{basis.floors.map(r=><option key={r.floor} value={r.floor}>{r.floor===0?"Ground":"Floor "+r.floor}</option>)}</select></label>
 <div className="purpose-table" style={{overflowX:"auto"}}><table><thead><tr><th>Level</th><th>Floor area (ft²)</th><th>Wall single-face (ft²)</th><th>Roof area (ft²)</th><th>Illustrative wall volume (m³)</th><th>Illustrative slab volume (m³)</th></tr></thead><tbody>{rows.map(r=><tr key={r.floor}><td>{r.floor+1}</td><td>{fmt(r.floorSqFt)}</td><td>{fmt(r.faceSqFt)}</td><td>{fmt(r.roofSqFt)}</td><td>{fmt(r.grossWallM3)}</td><td>{fmt(r.grossSlabM3)}</td></tr>)}</tbody></table></div>
 <p>Selected floor area: {fmt(sums.floorSqFt)} ft² · geometric wall volume: {fmt(sums.grossWallM3)} m³ · geometric slab volume: {fmt(sums.grossSlabM3)} m³.</p>
 <p>Enter reviewed product coverage and allowances. All selected gross floors and wall faces are included; subtract non-finished surfaces in the existing detailed finish planner or have quantities professionally reviewed.</p>
 <div className="purpose-tabs">
 <label>Painted wall faces<select value={faces} onChange={e=>{setFaces(e.target.value==="2"?2:1);setReviewed(false)}}><option value="1">One face</option><option value="2">Both faces</option></select></label>
 <label>Paint coverage (m²/L per coat)<input type="number" min=".1" max="100" step=".1" value={coverage} onChange={e=>{setCoverage(e.target.value);setReviewed(false)}}/></label>
 <label>Paint coats<select value={coats} onChange={e=>{setCoats(Number(e.target.value));setReviewed(false)}}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label>
 <label>Paint allowance (%)<input type="number" min="0" max="50" value={paintWaste} onChange={e=>{setPaintWaste(e.target.value);setReviewed(false)}}/></label>
 <label>Tile coverage (ft²/box)<input type="number" min=".1" max="1000" step=".1" value={tileCoverage} onChange={e=>{setTileCoverage(e.target.value);setReviewed(false)}}/></label>
 <label>Tile allowance (%)<input type="number" min="0" max="50" value={tileWaste} onChange={e=>{setTileWaste(e.target.value);setReviewed(false)}}/></label>
 </div>
 {amounts?<p role="status">Illustrative paint: {fmt(amounts.paintLitres)} L · floor tiles: {fmt(amounts.tileBoxes)} boxes.</p>:<p>Enter valid coverage and allowance values for both materials.</p>}
 <label><input type="checkbox" checked={reviewed} disabled={!amounts} onChange={e=>setReviewed(e.target.checked)}/> I reviewed the actual finish scope and product specifications; these are draft quote quantities only.</label>
 <div className="purpose-tabs">{paint&&<Link className="button button-outline" href={paint}>Prepare paint quote</Link>}{tiles&&<Link className="button button-outline" href={tiles}>Prepare tile quote</Link>}</div>
 </details>;
}
