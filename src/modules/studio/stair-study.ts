import {overlapArea,type PlanModel,type Rect,type Room,type Opening} from "./plan-model.ts";
/** Conservative straight-flight study in feet, not a code/structural approval.
 * Never invent treads inside a reservation that cannot contain the flight and
 * landings, or whose actual door locations cannot reach the correct landings. */
export type StairStudy={roomId:string;upperRoomId:string;floor:number;kind:"straight"|"dog-leg";riseFt:number;treadFt:number;steps:(Rect&{topFt:number})[];landings:(Rect&{topFt:number})[]};
const EPS=1e-5;
export function straightStairStudy(lower:Room,upper:Room,heightFt:number,doors:readonly Opening[]):StairStudy|null{
 if(lower.kind!=="stairs"||upper.kind!=="stairs"||upper.floor!==lower.floor+1||[lower.x-upper.x,lower.y-upper.y,lower.w-upper.w,lower.d-upper.d].some(n=>Math.abs(n)>EPS)||!Number.isFinite(heightFt)||heightFt<=0)return null;
 const risers=Math.ceil(heightFt/(7.5/12)),riseFt=heightFt/risers,treadFt=10/12,run=(risers-1)*treadFt,landing=3,width=3;
 const lowerDoors=doors.filter(o=>o.kind==="door"&&o.roomId===lower.id&&o.connectsTo),upperDoors=doors.filter(o=>o.kind==="door"&&o.roomId===upper.id&&o.connectsTo);
 // Only support direct end-wall entries. Side-entry or turning stair requires
 // a separately designed and checked landing; do not fake a route.
 for(const axis of ["x","y"] as const)for(const reverse of [false,true]){
  const length=axis==="x"?lower.w:lower.d,cross=axis==="x"?lower.d:lower.w;
  if(length<run+2*landing+.5||cross<width+.5)continue;
  const start=axis==="x"?(reverse?"right":"left"):(reverse?"rear":"front"),end=axis==="x"?(reverse?"left":"right"):(reverse?"front":"rear");
  for(const a of lowerDoors.filter(o=>o.side===start&&o.widthFt>=2.5))for(const b of upperDoors.filter(o=>o.side===end&&o.widthFt>=2.5)){
   const aMid=a.atFt+a.widthFt/2,bMid=b.atFt+b.widthFt/2;
   const crossStart=Math.max(.25,Math.min(cross-width-.25,(aMid+bMid)/2-width/2));
   if(a.atFt<crossStart-EPS||a.atFt+a.widthFt>crossStart+width+EPS||b.atFt<crossStart-EPS||b.atFt+b.widthFt>crossStart+width+EPS)continue;
   const part=(offset:number,depth:number,topFt:number)=>{const u=reverse?length-offset-depth:offset;return axis==="x"?{x:lower.x+u,y:lower.y+crossStart,w:depth,d:width,topFt}:{x:lower.x+crossStart,y:lower.y+u,w:width,d:depth,topFt};};
   // Extend the upper landing to the actual exit rather than leave a gap.
   return {roomId:lower.id,upperRoomId:upper.id,floor:lower.floor,kind:"straight",riseFt,treadFt,steps:Array.from({length:risers-1},(_,i)=>part(landing+i*treadFt,treadFt,(i+1)*riseFt)),landings:[part(0,landing,0),part(landing+run,length-landing-run,heightFt)]};
  }
 }
 return null;
}
/** Two opposing flights with a full-width turning landing. A conservative
 * footprint and door alignment check, not a headroom or code certificate. */
export function dogLegStairStudy(lower:Room,upper:Room,heightFt:number,doors:readonly Opening[]):StairStudy|null{
 if(lower.kind!=="stairs"||upper.kind!=="stairs"||upper.floor!==lower.floor+1||[lower.x-upper.x,lower.y-upper.y,lower.w-upper.w,lower.d-upper.d].some(n=>Math.abs(n)>EPS)||!Number.isFinite(heightFt)||heightFt<7||heightFt>14)return null;
 const count=Math.ceil(heightFt/(7.5/12)),first=Math.floor(count/2),second=count-first,riseFt=heightFt/count,treadFt=10/12,width=3,gap=.25,landing=3;
 const runA=(first-1)*treadFt,runB=(second-1)*treadFt,run=Math.max(runA,runB),crossSpan=width*2+gap;
 const validDoor=(o:Opening)=>o.kind==="door"&&!!o.connectsTo&&o.widthFt>=2.5;
 for(const axis of ["x","y"] as const)for(const reverse of [false,true])for(const swap of [false,true]){
  const length=axis==="x"?lower.w:lower.d,cross=axis==="x"?lower.d:lower.w;
  if(length+EPS<landing*2+run||cross+EPS<crossSpan+.5)continue;
  const side=axis==="x"?(reverse?"right":"left"):(reverse?"rear":"front");
  for(const a of doors.filter(o=>o.roomId===lower.id&&validDoor(o)&&o.side===side))for(const b of doors.filter(o=>o.roomId===upper.id&&validDoor(o)&&o.side===side)){
   const laneA=swap?width+gap:0,laneB=swap?0:width+gap;
   const startMin=Math.max(.25,a.atFt+a.widthFt-laneA-width,b.atFt+b.widthFt-laneB-width);
   const startMax=Math.min(cross-crossSpan-.25,a.atFt-laneA,b.atFt-laneB);
   if(startMin>startMax+EPS)continue;
   const part=(offset:number,depth:number,lane:number,w:number,topFt:number)=>{const u=reverse?length-offset-depth:offset;return axis==="x"?{x:lower.x+u,y:lower.y+startMin+lane,w:depth,d:w,topFt}:{x:lower.x+startMin+lane,y:lower.y+u,w,d:depth,topFt};};
   // Both flights meet the same turn platform. A shorter flight receives a
   // longer approach/exit landing, not a gap or invented tread.
   const turn=length-landing,entry=turn-runA,exit=turn-runB;
   return {roomId:lower.id,upperRoomId:upper.id,floor:lower.floor,kind:"dog-leg",riseFt,treadFt,
    steps:[...Array.from({length:first-1},(_,i)=>part(entry+i*treadFt,treadFt,laneA,width,(i+1)*riseFt)),...Array.from({length:second-1},(_,i)=>part(turn-(i+1)*treadFt,treadFt,laneB,width,(first+i+1)*riseFt))],
    landings:[part(0,entry,laneA,width,0),part(turn,landing,0,crossSpan,first*riseFt),part(0,exit,laneB,width,heightFt)]};
  }
 }
 return null;
}
/** Upper slab must not cover a flight. Retain only the actual arrival landing
 * within the checked stair bay; unverified bays keep their conceptual slab. */
export function stairFloorPatches(room:Room,studies:readonly StairStudy[]):Rect[]{
 const below=studies.find(s=>s.floor===room.floor-1&&s.upperRoomId===room.id);
 if(room.kind!=="stairs"||!below)return [room];
 const top=Math.max(...below.landings.map(l=>l.topFt));
 const arrival=below.landings.filter(l=>Math.abs(l.topFt-top)<EPS);
 const departure=studies.find(s=>s.roomId===room.id)?.landings.filter(l=>l.topFt===0)??[];
 return [...arrival,...departure].map(({x,y,w,d})=>({x,y,w,d}));
}
/** Concept tread thickness, including the riser overlap. Not structural sizing. */
export function stairStepDepthFt(study:StairStudy,topFt:number){return Math.min(topFt,study.riseFt+.18)}
/** Check projected walking surfaces against the modeled underside of the next
 * flight. A same-level landing touching its own continuation is not overhead. */
export function stackedStairClearance(lower:StairStudy,upper:StairStudy,heightFt:number):boolean{
 if(lower.upperRoomId!==upper.roomId||upper.floor!==lower.floor+1)return false;
 const arrival=lower.landings.filter(l=>Math.abs(l.topFt-heightFt)<EPS),departure=upper.landings.filter(l=>l.topFt===0);
 if(arrival.some(a=>departure.some(b=>overlapArea(a,b)>EPS)))return false;
 // Intermediate floor requires both distinct access lanes. A slab under the
 // departure must not cover a lower flight within the advisory headroom.
 const overhead=[...upper.steps.map(s=>({...s,bottom:heightFt+s.topFt-stairStepDepthFt(upper,s.topFt)})),
 ...upper.landings.map(s=>({...s,bottom:heightFt+s.topFt-.46})),
 ...arrival.map(s=>({...s,bottom:heightFt-.46}))];
 const walked=[...lower.steps,...lower.landings.filter(l=>l.topFt<heightFt-EPS)];
 for(const a of walked)for(const b of overhead)if(overlapArea(a,b)>EPS&&b.bottom-a.topFt<6.8-EPS)return false;
 return true;
}
export function residentialStairStudies(plan:PlanModel){
 const studies:StairStudy[]=[],unresolved:string[]=[];
 for(const lower of plan.rooms.filter(r=>r.kind==="stairs"&&r.floor<plan.floors-1)){
  const upper=plan.rooms.find(r=>r.kind==="stairs"&&r.floor===lower.floor+1&&Math.abs(r.x-lower.x)<EPS&&Math.abs(r.y-lower.y)<EPS);
  const study=upper?(straightStairStudy(lower,upper,plan.walls.heightFt,plan.openings)??dogLegStairStudy(lower,upper,plan.walls.heightFt,plan.openings)):null;
  if(study)studies.push(study);else unresolved.push(lower.id);
 }
 if(plan.floors>2){
  // Reject the entire stack if any level is absent or the intermediate
  // floor cannot carry two distinct landings with clear modeled headroom.
  const ordered=[...studies].sort((a,b)=>a.floor-b.floor);
  if(unresolved.length||ordered.length!==plan.floors-1||ordered.slice(1).some((s,i)=>!stackedStairClearance(ordered[i],s,plan.walls.heightFt)))
   return {studies:[],unresolved:plan.rooms.filter(r=>r.kind==="stairs"&&r.floor<plan.floors-1).map(r=>r.id)};
 }
 return {studies,unresolved};
}
