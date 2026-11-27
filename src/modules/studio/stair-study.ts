import type {PlanModel,Rect,Room,Opening} from "./plan-model.ts";
/** Conservative straight-flight study in feet, not a code/structural approval.
 * Never invent treads inside a reservation that cannot contain the flight and
 * landings, or whose actual door locations cannot reach the correct landings. */
export type StairStudy={roomId:string;floor:number;riseFt:number;treadFt:number;steps:(Rect&{topFt:number})[];landings:(Rect&{topFt:number})[]};
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
   return {roomId:lower.id,floor:lower.floor,riseFt,treadFt,steps:Array.from({length:risers-1},(_,i)=>part(landing+i*treadFt,treadFt,(i+1)*riseFt)),landings:[part(0,landing,0),part(landing+run,length-landing-run,heightFt)]};
  }
 }
 return null;
}
export function residentialStairStudies(plan:PlanModel){
 const studies:StairStudy[]=[],unresolved:string[]=[];
 for(const lower of plan.rooms.filter(r=>r.kind==="stairs"&&r.floor<plan.floors-1)){
  const upper=plan.rooms.find(r=>r.kind==="stairs"&&r.floor===lower.floor+1&&Math.abs(r.x-lower.x)<EPS&&Math.abs(r.y-lower.y)<EPS);
  const study=upper?straightStairStudy(lower,upper,plan.walls.heightFt,plan.openings):null;
  if(study)studies.push(study);else unresolved.push(lower.id);
 }
 return {studies,unresolved};
}
