import {area,isOtsRoom,overlapArea,sharedEdge,validatePlan,type PlanModel,type Rect,type Room,type Opening} from "./plan-model.ts";
import {rectInsideShape} from "./site-shape.ts";
import {subtractRect,exposedRoofPatches} from "./plan-surfaces.ts";
import {ventilationReport,ventilationVariant,windowExposure} from "./ventilation.ts";
import {interiorFitReport,preservesEssentialInterior} from "./furniture.ts";
const EPS=1e-5;
const equal=(a:number,b:number)=>Math.abs(a-b)<EPS;
const wet=(r:Room)=>["bath","kitchen","utility"].includes(r.kind);
const permitted=(r:Room)=>["terrace","utility","bath","kitchen","living","bedroom","dining","lounge"].includes(r.kind)&&!isOtsRoom(r);
const fixed=(v:number)=>Math.round(v*1e6)/1e6;
function trimOpening(o:Opening,old:Room,next:Room):Opening|null{
 const horizontal=o.side==="front"||o.side==="rear",edge=(r:Room)=>horizontal?r.y+(o.side==="rear"?r.d:0):r.x+(o.side==="right"?r.w:0);
 if(!equal(edge(old),edge(next)))return null;
 const from=horizontal?old.x:old.y,newFrom=horizontal?next.x:next.y,len=horizontal?next.w:next.d,at=from+o.atFt-newFrom;
 if(at<-EPS||at+o.widthFt>len+EPS)return null;
 return {...o,atFt:fixed(Math.max(0,at))};
}
function shaftCandidate(p:PlanModel,rect:Rect,replaceBlockedWindows=false):PlanModel|null{
 const rooms:Room[]=[],replaced=new Map<string,Room>(),removed=new Set<string>();
 for(const r of p.rooms){
  if(overlapArea(r,rect)<EPS){rooms.push(r);continue;}
  if(!permitted(r))return null;
  const rem=subtractRect(r,rect);
  if(r.kind==="terrace"){
   if(p.openings.some(o=>o.roomId===r.id||o.connectsTo===r.id))return null;
   removed.add(r.id);for(const [i,s] of rem.entries())rooms.push({...r,...s,id:r.id+"-ots-rem-"+i});
  }else{
   // Never remove an enclosed room or create an L-shaped nominal rectangle.
   if(rem.length!==1)return null;
   const next={...r,...rem[0]};if(Math.min(next.w,next.d)<3)return null;
   rooms.push(next);replaced.set(r.id,next);
  }
 }
 const openings:Opening[]=[];
 for(const o of p.openings){
  if(removed.has(o.roomId)||o.connectsTo&&removed.has(o.connectsTo))return null;
  const next=replaced.get(o.roomId);
  if(next){const old=p.rooms.find(r=>r.id===o.roomId)!,trimmed=trimOpening(o,old,next);if(!trimmed){
   // A blocked boundary window is not usable ventilation. Only on the fallback
   // search may it be replaced; never remove doors or verified exposed windows.
   if(replaceBlockedWindows&&o.kind==="window"&&!o.connectsTo&&windowExposure(p,old,o)==="review")continue;
   return null;
  }openings.push(trimmed);}
  else openings.push({...o});
 }
 for(let floor=0;floor<p.floors;floor++)rooms.push({...rect,id:"ots-v1-floor-"+floor,label:"Open-to-sky ventilation (roof jaal)",kind:"terrace",floor,minClearWidthFt:3});
 const revised:PlanModel={...p,id:p.id+"-ots-v1",rooms,openings,notes:[...p.notes,"Continuous open-to-sky ventilation reserve with conceptual roof grille. Verify shaft proportions, drainage, fire separation, waterproofing and engineered grille safety."]};
 // Validate after the shaft-facing openings have been added, not before.
 // Require actual adjacent wet-room ventilation, not an isolated decorative hole.
 const adjacent=rooms.filter(r=>(wet(r)||["bedroom","living","dining","lounge"].includes(r.kind))&&rooms.some(s=>isOtsRoom(s)&&s.floor===r.floor&&sharedEdge(r,s)));
 if(!adjacent.some(wet))return null;
 // Explicitly model a screened aperture into the shaft. Other additional
 // windows are added by the same validated ventilation engine.
 for(const r of adjacent){
  const s=rooms.find(s=>isOtsRoom(s)&&s.floor===r.floor&&sharedEdge(r,s))!,edge=sharedEdge(r,s)!;
  const w=Math.min(2.5,edge.length-.5),from=edge.aSide==="front"||edge.aSide==="rear"?r.x:r.y;
  if(w<2)continue;
  const atFt=fixed(edge.from+(edge.length-w)/2-from);
  if(openings.some(o=>o.roomId===r.id&&o.side===edge.aSide&&atFt<o.atFt+o.widthFt+.15&&atFt+w>o.atFt-.15))continue;
  openings.push({id:"ots-v1-window-"+r.id,roomId:r.id,side:edge.aSide,atFt,widthFt:w,sillFt:5.5,heightFt:2,kind:"window"});
 }
 if(!openings.some(o=>o.id.startsWith("ots-v1-window-")&&adjacent.some(r=>wet(r)&&r.id===o.roomId)&&windowExposure(revised,rooms.find(r=>r.id===o.roomId)!,o)==="ots")||validatePlan(revised).length)return null;
 if(exposedRoofPatches(revised).some(r=>overlapArea(r,rect)>EPS))return null;
 return revised;
}
/** Search real boundary-aligned rectangles. Prefer wet-core adjacency and
 * minimal loss of enclosed space. Never alter input dimensions or required rooms. */
export function otsVariant(p:PlanModel):PlanModel{
 const compact=[[3,3],[3,4],[4,3],[4,4]],expanded=[[3,5],[5,3],[4,5],[5,4],[5,5]];
 return searchOts(p,compact)??searchOts(p,expanded)??searchOts(p,[...compact,...expanded],true)??p;
}
function searchOts(p:PlanModel,sizes:number[][],replaceBlockedWindows=false):PlanModel|null{
 if(p.rooms.some(isOtsRoom))return p;
 const shape=p.plot.siteShape??{kind:"rectangle"} as const,sb=p.setbacks;
 const W=p.plot.widthFt-sb.rightFt,D=p.plot.depthFt-sb.rearFt;
 const seen=new Set<string>(),pool:{r:Rect;score:number}[]=[];
 for(const target of p.rooms.filter(wet))for(const [w,d] of [...sizes,...(target.floor===0&&target.w>=3&&target.w<=9?[[target.w,3],[target.w,4]]:[]),...(target.floor===0&&target.d>=3&&target.d<=9?[[3,target.d],[4,target.d]]:[])]){
  const x=[target.x-w,target.x+target.w,target.x,target.x+target.w-w,target.x+(target.w-w)/2];
  const y=[target.y-d,target.y+target.d,target.y,target.y+target.d-d,target.y+(target.d-d)/2];
  for(const a of x)for(const b of y){
   const r={x:fixed(a),y:fixed(b),w,d},key=JSON.stringify(r);if(seen.has(key))continue;seen.add(key);
   if(r.x<sb.leftFt-EPS||r.y<sb.frontFt-EPS||r.x+w>W+EPS||r.y+d>D+EPS||!rectInsideShape(r,p.plot.widthFt,p.plot.depthFt,shape))continue;
   const affected=p.rooms.filter(q=>overlapArea(q,r)>EPS);if(affected.some(q=>!permitted(q)))continue;
   const benefit=p.rooms.filter(q=>wet(q)&&sharedEdge(q,r)).length+affected.filter(q=>wet(q)&&subtractRect(q,r).some(rest=>sharedEdge(rest,r))).length;
   const cost=affected.filter(q=>q.kind!=="terrace").reduce((n,q)=>n+overlapArea(q,r)*(wet(q)?1:3),0);
   pool.push({r,score:benefit*50-cost-area(r)*.2});
  }
 }
 pool.sort((a,b)=>b.score-a.score||a.r.x-b.r.x||a.r.y-b.r.y||a.r.w-b.r.w||a.r.d-b.r.d);
 const before=interiorFitReport(p);
 let best:PlanModel|null=null,bestScore=-Infinity;
 for(const {r,score} of pool.slice(0,replaceBlockedWindows?192:96)){
  const candidate=shaftCandidate(p,r,replaceBlockedWindows);if(!candidate)continue;
  const report=ventilationReport(candidate);
  const rank=report.rows.filter(q=>q.openings.some(o=>o.exposure==="ots")).length*100+report.score*30+score;
  if(rank>bestScore&&preservesEssentialInterior(before,interiorFitReport(candidate))){best=candidate;bestScore=rank;}
 }
 return best;
}
/** Deterministic roof grille geometry, feet. No solid cover; bar spacing is
 * illustrative, not a fall-protection specification. */
export function otsGrilleBars(p:PlanModel):Rect[]{
 const r=p.rooms.find(q=>isOtsRoom(q)&&q.floor===p.floors-1);if(!r)return [];
 const bars:Rect[]=[],t=.075;
 for(let i=0;i<=Math.ceil(r.w/.4);i++){const x=r.x+Math.min(r.w-t,i*r.w/Math.ceil(r.w/.4));bars.push({x,y:r.y,w:t,d:r.d});}
 for(let i=0;i<=Math.ceil(r.d/.4);i++){const y=r.y+Math.min(r.d-t,i*r.d/Math.ceil(r.d/.4));bars.push({x:r.x,y,w:r.w,d:t});}
 return bars;
}
export function airOptimizedPlan(p:PlanModel,shaft:boolean,windows:boolean){
 const base=shaft?otsVariant(p):p;
 if(!windows)return base;
 const revised=ventilationVariant(base);
 return revised===base||preservesEssentialInterior(interiorFitReport(base),interiorFitReport(revised))?revised:base;
}
