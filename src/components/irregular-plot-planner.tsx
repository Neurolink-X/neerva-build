"use client";
import {useState} from "react";
import {parsePlot,validatePlot,polygonArea,roadEnvelopeChoices,type PlotPoint,type PlotEnvelope,type PlotContext} from "@/modules/studio/irregular-plot";
const examples={rectangle:"0,0\n100,0\n100,120\n0,120",l:"0,0\n120,0\n120,70\n70,70\n70,140\n0,140",trapezoid:"0,0\n140,0\n110,160\n20,160"} as const;
type Result={points:PlotPoint[];choices:PlotEnvelope[];area:number};
export function IrregularPlotPlanner({onUse}:{onUse:(w:number,d:number,context:PlotContext)=>void}){
 const [choice,setChoice]=useState(0);
 const [input,setInput]=useState<string>(examples.l),[result,setResult]=useState<Result|null>(null),[error,setError]=useState("");
 function analyze(){
  const p=parsePlot(input),issue=p?validatePlot(p):"Use one x,y pair per line in feet, up to three decimal places.";
  if(!p||issue){setResult(null);setError(issue??"Invalid boundary.");return;}
  setError("");setChoice(0);setResult({points:p,area:polygonArea(p),choices:roadEnvelopeChoices(p)});
 }
 function update(s:string){setInput(s);setResult(null);setError("");}
 const fit=result?.choices[choice];
 const fmt=(n:number)=>n.toLocaleString("en-IN",{maximumFractionDigits:2});
 return <details className="purpose-engineering"><summary>Irregular plot feasibility</summary>
 <p>Enter surveyed corners in perimeter order. Road edge is y=0; x runs along the road. This tool compares contained road-facing rectangular planning envelopes of different proportions inside your measured polygon. It does not calculate statutory setbacks or design the leftover land.</p>
 <div className="purpose-tabs">{Object.entries(examples).map(([key,value])=><button key={key} type="button" className="button button-outline" onClick={()=>update(value)}>{key==="l"?"L-shaped":key==="trapezoid"?"Trapezoid":"Rectangle"} example</button>)}</div>
 <label>Boundary vertices (x,y feet)<textarea rows={6} maxLength={2048} value={input} onChange={e=>update(e.target.value)} style={{width:"100%",fontFamily:"monospace"}}/></label>
 <button type="button" className="button button-dark" onClick={analyze}>Analyze boundary</button>
 {error&&<p role="alert">{error}</p>}
 {result&&<div aria-live="polite"><svg role="img" aria-label="Measured polygon and candidate rectangular envelope" viewBox={[-8,-8,Math.max(...result.points.map(p=>p.x))+16,Math.max(...result.points.map(p=>p.y))+16].join(" ")} style={{width:"100%",maxHeight:320}}>
 <polygon points={result.points.map(p=>p.x+","+p.y).join(" ")} fill="#e0e8d3" stroke="#465b40" strokeWidth=".7"/>
 {fit&&<rect x={fit.x} y={fit.y} width={fit.w} height={fit.d} fill="#83a6c1" fillOpacity=".65" stroke="#345a7b" strokeWidth=".6"/>}
 {result.points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="1.1" fill="#465b40"/>)}</svg>
 <div className="purpose-tabs" role="group" aria-label="Contained plot envelopes">{result.choices.map((r,i)=><button key={i} type="button" aria-pressed={choice===i} onClick={()=>setChoice(i)}>{fmt(r.w)} × {fmt(r.d)} ft</button>)}</div><p>Measured polygon area: {fmt(result.area)} sq ft.</p>
 {fit?<><p>Candidate envelope: {fmt(fit.w)} × {fmt(fit.d)} ft; offset {fmt(fit.x)} ft from origin. Remaining land: {fmt(result.area-fit.w*fit.d)} sq ft.</p>
 <button type="button" className="button button-outline" onClick={()=>onUse(Math.floor(fit!.w*1000)/1000,Math.floor(fit!.d*1000)/1000,{points:result.points,offsetXFt:fit!.x})}>Use envelope dimensions in planner</button>
 <p>Existing planner will use the local rectangle only, with its own margins. The surveyed boundary and offset are retained with your selected concept. The building itself remains rectangular; residual land and statutory setbacks need separate review.</p></>:<p>No supported road-facing rectangular envelope found. A custom architectural layout is needed.</p>}</div>}
 </details>;
}
