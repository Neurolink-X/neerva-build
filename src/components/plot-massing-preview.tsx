"use client";

/**
 * Parametric plot-volume study. It depicts site proportions and an illustrative
 * building envelope only — never room geometry, verified setbacks, structure,
 * permissions, or a real CAD/BIM model.
 */
type PlotMassingPreviewProps={widthFt:number;depthFt:number;floors:number;parking:boolean};
type Point=[number,number];
const pts=(...p:Point[])=>p.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
export function PlotMassingPreview({widthFt,depthFt,floors,parking}:PlotMassingPreviewProps){
 const valid=Number.isFinite(widthFt)&&Number.isFinite(depthFt)&&widthFt>=10&&widthFt<=200&&depthFt>=15&&depthFt<=250;
 if(!valid)return <div className="nfit-massing nfit-massing-empty" role="status">Enter valid width and depth to preview your plot proportions.</div>;
 const scale=Math.min(133/widthFt,155/depthFt);
 const project=(x:number,y:number,z=0):Point=>[210+(x*.98-y*.67)*scale,68+(x*.40+y*.48)*scale-z];
 const top=(x:number,y:number):Point=>project(x,y,16*Math.min(3,Math.max(1,floors)));
 const plot=[project(0,0),project(widthFt,0),project(widthFt,depthFt),project(0,depthFt)];
 const x0=widthFt*.08,x1=widthFt*.88,y0=depthFt*.12,y1=depthFt*.82;
 const a=project(x0,y0),b=project(x1,y0),c=project(x1,y1),d=project(x0,y1);
 const at=top(x0,y0),bt=top(x1,y0),ct=top(x1,y1),dt=top(x0,y1);
 return <section className="nfit-massing" aria-label="Parametric plot and illustrative three-dimensional building-volume preview">
  <div className="nfit-massing-head"><div><span className="nfit-kicker">LIVE CONCEPT STUDY</span><h3>Plot proportion in 3D</h3></div><span className="nfit-massing-size">{Number(widthFt.toFixed(1))} × {Number(depthFt.toFixed(1))} ft</span></div>
  <svg viewBox="0 0 420 305" role="img" aria-label={`Isometric massing concept for a ${widthFt} by ${depthFt} feet plot with ${floors} floor levels`}>
   <defs><linearGradient id="nfit-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e6ecde"/><stop offset="1" stopColor="#c8d8c4"/></linearGradient><linearGradient id="nfit-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c49d78"/><stop offset="1" stopColor="#987558"/></linearGradient></defs>
   <polygon points={pts(...plot)} fill="url(#nfit-ground)" stroke="#627b69" strokeWidth="2"/>
   <polygon points={pts(a,b,bt,at)} fill="#e6c7a7" stroke="#866647" strokeWidth="1"/>
   <polygon points={pts(b,c,ct,bt)} fill="url(#nfit-wall)" stroke="#866647" strokeWidth="1"/>
   <polygon points={pts(c,d,dt,ct)} fill="#a87d5b" stroke="#866647" strokeWidth="1"/>
   <polygon points={pts(d,a,at,dt)} fill="#d8b38e" stroke="#866647" strokeWidth="1"/>
   <polygon points={pts(at,bt,ct,dt)} fill="#f3e8d6" stroke="#735d48" strokeWidth="1.8"/>
   <path d={`M ${a[0]} ${a[1]} L ${d[0]} ${d[1]}`} fill="none" stroke="#446d52" strokeWidth="1.5" strokeDasharray="4 4"/>
   <text x="12" y="286" fill="#355543" fontSize="12" fontWeight="700">Width: {Number(widthFt.toFixed(1))} ft</text>
   <text x="406" y="286" textAnchor="end" fill="#355543" fontSize="12" fontWeight="700">Depth: {Number(depthFt.toFixed(1))} ft</text>
  </svg>
  <div className="nfit-massing-stats"><span>{Math.round(widthFt*depthFt).toLocaleString("en-IN")} sq ft plot</span><span>{(widthFt*depthFt/9).toFixed(1)} sq gaj</span><span>{Math.min(3,Math.max(1,floors))} conceptual level(s)</span></div>
  <p className="nfit-footnote">Illustrative 3D building volume, not a floor plan or architectural/structural model. Shown envelope is NOT based on verified setbacks or FAR. {parking?"Parking location and turning space need a proper site study.":""} A licensed architect must adapt and validate the layout.</p>
 </section>;
}
