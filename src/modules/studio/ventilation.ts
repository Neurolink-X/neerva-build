import {overlapArea,validatePlan,type Opening,type PlanModel,type Rect,type Room,type Side} from "./plan-model.ts";
import {rectInsideShape} from "./site-shape.ts";
const EPS=1e-6,sides:Side[]=["front","rear","left","right"];
const occupied=(r:Room)=>!["terrace","balcony","parking","verandah"].includes(r.kind);
const useful=(r:Room)=>["living","bedroom","kitchen","dining","lounge","bath","utility"].includes(r.kind);
const opposite=(a:Side,b:Side)=>(a==="front"&&b==="rear")||(a==="rear"&&b==="front")||(a==="left"&&b==="right")||(a==="right"&&b==="left");
const length=(r:Room,s:Side)=>s==="front"||s==="rear"?r.w:r.d;
export const compassWall=(s:Side,road:PlanModel["plot"]["roadSide"])=>{const dirs=["N","E","S","W"] as const;return dirs[(dirs.indexOf(road)+({front:0,right:1,rear:2,left:3}[s]))%4];};
/** Screen the actual aperture, not just the existence of a window. The 3 ft
 * open strip is a conservative concept study, NOT a statutory requirement. */
export function windowExposure(plan:PlanModel,r:Room,o:Pick<Opening,"side"|"atFt"|"widthFt">):"road"|"open-strip"|"review"{
 const {side,atFt,widthFt}=o;if(!Number.isFinite(atFt)||!Number.isFinite(widthFt)||atFt<0||widthFt<=0||atFt+widthFt>length(r,side)+EPS)return "review";
 const t=3,shape=plan.plot.siteShape??{kind:"rectangle"} as const;
 const strip:Rect=side==="front"?{x:r.x+atFt,y:Math.max(0,r.y-t),w:widthFt,d:Math.min(r.y,t)}:side==="rear"?{x:r.x+atFt,y:r.y+r.d,w:widthFt,d:t}:side==="left"?{x:r.x-t,y:r.y+atFt,w:t,d:widthFt}:{x:r.x+r.w,y:r.y+atFt,w:t,d:widthFt};
 // A direct route to the road may be shorter than 3 ft. Do not infer
 // side/rear exposure beyond the customer's measured property.
 const roadPath:Rect={x:r.x+atFt,y:0,w:widthFt,d:r.y};
 const blocked=(a:Rect,sky:boolean)=>plan.rooms.some(q=>q.id!==r.id&&q.floor>=r.floor&&(sky||q.floor===r.floor)&&occupied(q)&&overlapArea(q,a)>EPS);
 if(side==="front"&&(r.y<=EPS||rectInsideShape(roadPath,plan.plot.widthFt,plan.plot.depthFt,shape)&&!blocked(roadPath,false)))return "road";
 if(strip.w>EPS&&strip.d>=Math.min(t,widthFt)-EPS&&rectInsideShape(strip,plan.plot.widthFt,plan.plot.depthFt,shape)&&!blocked(strip,true))return "open-strip";
 return "review";
}
function candidates(p:PlanModel,r:Room,existing:readonly Opening[]){
 const bath=r.kind==="bath"||r.kind==="utility",w=bath?2:3,h=bath?2:4,sill=bath?5.5:3;
 const out:Opening[]=[];
 if(sill+h>p.walls.heightFt)return out;
 for(const side of sides){
  const len=length(r,side);if(len<w+.5)continue;
  const occupiedWall=existing.filter(o=>o.roomId===r.id&&o.side===side);
  if(occupiedWall.some(o=>o.kind==="window"&&windowExposure(p,r,o)!=="review"))continue;
  // Prefer a centred position, then search free intervals at 0.5 ft steps.
  const positions=[(len-w)/2,...Array.from({length:Math.max(0,Math.floor((len-w-.5)*2)+1)},(_,i)=>.25+i*.5)];
  for(const raw of positions){
   const atFt=Math.round(raw*1e6)/1e6;
   if(atFt<.25-EPS||atFt+w>len-.25+EPS||occupiedWall.some(o=>atFt<o.atFt+o.widthFt+.15&&atFt+w>o.atFt-.15))continue;
   const opening:Opening={id:"vent-v1-"+r.id+"-"+side,roomId:r.id,side,atFt,widthFt:w,sillFt:sill,heightFt:h,kind:"window"};
   if(windowExposure(p,r,opening)==="review")continue;
   out.push(opening);break;
  }
 }
 return out;
}
export function ventilationReport(p:PlanModel){
 const rows=p.rooms.filter(useful).map(r=>{
  const openings=p.openings.filter(o=>o.roomId===r.id&&o.kind==="window").map(o=>({id:o.id,side:o.side,compass:compassWall(o.side,p.plot.roadSide),width:o.widthFt,height:o.heightFt,exposure:windowExposure(p,r,o)}));
  const exposed=openings.filter(o=>o.exposure!=="review"),wallSet=[...new Set(exposed.map(o=>o.side))];
  const cross=wallSet.some(a=>wallSet.some(b=>opposite(a,b))),wet=r.kind==="bath"||r.kind==="utility"||r.kind==="kitchen";
  const proposed=candidates(p,r,p.openings).map(o=>({side:o.side,compass:compassWall(o.side,p.plot.roadSide),width:o.widthFt}));
  const recommendation=wet?(exposed.length?"Provide operable high-level opening and dedicated exhaust; check duct termination.":"Review an external exhaust route or correctly sized open-to-sky shaft; never discharge into an enclosed passage."):(cross?"Opposite exposed walls: potential cross-ventilation; verify opening operation and airflow.":exposed.length?"Single-sided or adjacent-wall exposure; consider another exposed wall where available.":"Review open-to-sky court, side clearance, or engineered fresh-air provision.");
  return {id:r.id,label:r.label,floor:r.floor,kind:r.kind,openings,exposed:exposed.length,cross,proposed,recommendation};
 });
 return {rows,exposed:rows.filter(r=>r.exposed>0).length,cross:rows.filter(r=>r.cross).length,total:rows.length,score:rows.length?(rows.reduce((s,r)=>s+Number(r.exposed>0)+.35*Number(r.cross),0)/rows.length):0};
}
/** Opt-in, versioned geometry. Existing openings and saved base IDs remain
 * unchanged. The identical model is used by drawings, 3D and server save. */
export function ventilationVariant(p:PlanModel):PlanModel{
 if(p.id.endsWith("-vent-v1"))return p;
 const openings=p.openings.map(o=>({...o}));
 for(const r of p.rooms.filter(useful)){
  const prior=openings.filter(o=>o.roomId===r.id&&o.kind==="window"&&windowExposure(p,r,o)!=="review").map(o=>o.side);
  const options=candidates(p,r,openings);
  options.sort((a,b)=>Number(prior.some(s=>opposite(s,b.side)))-Number(prior.some(s=>opposite(s,a.side)))||Number(windowExposure(p,r,b)==="road")-Number(windowExposure(p,r,a)==="road"));
  for(const o of options){
   if(prior.includes(o.side)||prior.length>=2)continue;
   openings.push(o);prior.push(o.side);
  }
 }
 if(openings.length===p.openings.length)return p;
 const revised={...p,id:p.id+"-vent-v1",openings,notes:[...p.notes,"Additional concept windows are screened for modeled open exposure only. Verify operability, privacy, fire safety and legal ventilation on site."]};
 return validatePlan(revised).length?p:revised;
}
