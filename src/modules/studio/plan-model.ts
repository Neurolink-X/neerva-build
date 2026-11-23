/**
 * PlanModel v1: the road is ALWAYS the y=0 edge in local site coordinates.
 * Compass orientation is metadata until a renderer transforms the whole site.
 * Units are feet. Concepts only, never local-authority approved drawings.
 */
export type RoadSide="N"|"E"|"S"|"W";
export type Side="front"|"rear"|"left"|"right";
export type RoomKind="parking"|"verandah"|"living"|"dining"|"kitchen"|"bedroom"|"bath"|"stairs"|"corridor"|"utility"|"balcony"|"lounge"|"terrace";
export type Rect={x:number;y:number;w:number;d:number};
export type Room=Rect&{id:string;label:string;kind:RoomKind;floor:number;minClearWidthFt:number;};
export type Opening={id:string;roomId:string;side:Side;atFt:number;widthFt:number;sillFt:number;heightFt:number;kind:"door"|"window";connectsTo?:string};
export type PlanModel={
 version:1;id:string;variant:"parking-left"|"parking-right";
 plot:{widthFt:number;depthFt:number;roadSide:RoadSide};
 setbacks:{frontFt:number;rearFt:number;leftFt:number;rightFt:number;verified:false};
 walls:{externalFt:number;internalFt:number;heightFt:number;parapetFt:number};
 floors:number;rooms:Room[];openings:Opening[];
 gate:{side:"front";xFt:number;widthFt:number};
 parking:{roomId:string;clearWidthFt:number;clearDepthFt:number}|null;
 stairs:{roomIds:string[];note:string};
 balcony:{roomId:string}|null;
 facade:{kit:"simple-parapet";main:string;accent:string};
 score:number;notes:string[];conceptOnly:true;
};
export type PlanBrief={widthFt:number;depthFt:number;roadSide:RoadSide;floors:1|2;bedrooms:number;parking:boolean;
 setbacks:{frontFt:number;rearFt:number;leftFt:number;rightFt:number};};
const EPS=1e-6;
export const snap=(n:number)=>Math.round(n*2)/2;
export const area=(r:Rect)=>r.w*r.d;
export const overlapArea=(a:Rect,b:Rect)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*
 Math.max(0,Math.min(a.y+a.d,b.y+b.d)-Math.max(a.y,b.y));
export function sharedEdge(a:Rect,b:Rect):{aSide:Side;bSide:Side;from:number;length:number}|null{
 const overlapX=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
 const overlapY=Math.min(a.y+a.d,b.y+b.d)-Math.max(a.y,b.y);
 if(overlapX>=2.8){
  if(Math.abs(a.y+a.d-b.y)<EPS)return {aSide:"rear",bSide:"front",from:Math.max(a.x,b.x),length:overlapX};
  if(Math.abs(b.y+b.d-a.y)<EPS)return {aSide:"front",bSide:"rear",from:Math.max(a.x,b.x),length:overlapX};
 }
 if(overlapY>=2.8){
  if(Math.abs(a.x+a.w-b.x)<EPS)return {aSide:"right",bSide:"left",from:Math.max(a.y,b.y),length:overlapY};
  if(Math.abs(b.x+b.w-a.x)<EPS)return {aSide:"left",bSide:"right",from:Math.max(a.y,b.y),length:overlapY};
 }
 return null;
}
export type WallBox={x0:number;x1:number;y0:number;y1:number};
/** Geometric opening decomposition, refusing invalid or overlapping openings. */
export function wallBoxes(lengthFt:number,heightFt:number,openings:readonly {atFt:number;widthFt:number;sillFt:number;heightFt:number}[]):WallBox[]{
 if(!Number.isFinite(lengthFt)||!Number.isFinite(heightFt)||lengthFt<=0||heightFt<=0)throw new RangeError("Invalid wall dimensions");
 const sorted=[...openings].sort((a,b)=>a.atFt-b.atFt);
 const out:WallBox[]=[];let cursor=0;
 for(const o of sorted){
  if(![o.atFt,o.widthFt,o.sillFt,o.heightFt].every(Number.isFinite)||o.atFt<cursor-EPS||o.widthFt<=0||
   o.atFt+o.widthFt>lengthFt+EPS||o.sillFt<0||o.heightFt<=0||o.sillFt+o.heightFt>heightFt+EPS){
   throw new RangeError("Wall opening overlaps or exceeds wall");
  }
  if(o.atFt>cursor+EPS)out.push({x0:cursor,x1:o.atFt,y0:0,y1:heightFt});
  if(o.sillFt>EPS)out.push({x0:o.atFt,x1:o.atFt+o.widthFt,y0:0,y1:o.sillFt});
  if(o.sillFt+o.heightFt<heightFt-EPS)out.push({x0:o.atFt,x1:o.atFt+o.widthFt,y0:o.sillFt+o.heightFt,y1:heightFt});
  cursor=o.atFt+o.widthFt;
 }
 if(cursor<lengthFt-EPS)out.push({x0:cursor,x1:lengthFt,y0:0,y1:heightFt});
 return out;
}
function near(a:number,b:number){return Math.abs(a-b)<.01}
function externalSide(room:Room,plot:PlanModel["plot"],sb:PlanModel["setbacks"]):Side[]{
 const left=sb.leftFt,front=sb.frontFt,right=plot.widthFt-sb.rightFt,rear=plot.depthFt-sb.rearFt;
 return (["front","rear","left","right"] as Side[]).filter(side=>side==="front"?near(room.y,front):
 side==="rear"?near(room.y+room.d,rear):side==="left"?near(room.x,left):near(room.x+room.w,right));
}
export function validatePlan(p:PlanModel):string[]{
 const errors:string[]=[];
 if(p.version!==1||!["N","E","S","W"].includes(p.plot.roadSide))errors.push("Invalid plan version or road side");
 const {widthFt:w,depthFt:d}=p.plot,sb=p.setbacks;
 if(![w,d,sb.frontFt,sb.rearFt,sb.leftFt,sb.rightFt,p.walls.externalFt,p.walls.internalFt,p.walls.heightFt].every(Number.isFinite)||
  w<10||d<15||Object.values(sb).some(x=>typeof x==="number"&&x<0)||p.walls.externalFt<=0||p.walls.internalFt<=0)errors.push("Invalid plot, setbacks or wall thickness");
 const U={x:sb.leftFt,y:sb.frontFt,w:w-sb.leftFt-sb.rightFt,d:d-sb.frontFt-sb.rearFt};
 const ids=new Set<string>();
 for(const r of p.rooms){
  if(ids.has(r.id))errors.push("Duplicate room id "+r.id);ids.add(r.id);
  if(![r.x,r.y,r.w,r.d].every(Number.isFinite)||r.w<=0||r.d<=0||r.floor<0||r.floor>=p.floors||
    r.x<U.x-EPS||r.y<U.y-EPS||r.x+r.w>U.x+U.w+EPS||r.y+r.d>U.y+U.d+EPS)errors.push("Room outside usable plot "+r.id);
  const clear=Math.min(r.w,r.d);
  if(r.kind==="bedroom"&&(area(r)<95||clear<8))errors.push("Bedroom below advisory space minimum "+r.id);
  if(r.kind==="living"&&(area(r)<95||clear<8))errors.push("Living below advisory space minimum "+r.id);
  if(r.kind==="kitchen"&&(area(r)<48||clear<6))errors.push("Kitchen below advisory space minimum "+r.id);
  if(r.kind==="parking"&&(r.w<8||r.d<16||!near(r.y,U.y)))errors.push("Parking lacks 8 × 16 ft road-side clearance "+r.id);
 }
 for(let i=0;i<p.rooms.length;i++)for(let j=i+1;j<p.rooms.length;j++)
  if(p.rooms[i].floor===p.rooms[j].floor&&overlapArea(p.rooms[i],p.rooms[j])>.01)errors.push("Rooms overlap "+p.rooms[i].id+"/"+p.rooms[j].id);
 const byId=new Map(p.rooms.map(r=>[r.id,r]));
 for(const o of p.openings){
  const r=byId.get(o.roomId),len=r?(o.side==="front"||o.side==="rear"?r.w:r.d):0;
  if(!r||o.atFt<0||o.widthFt<=0||o.atFt+o.widthFt>len+EPS||o.sillFt<0||o.heightFt<=0||
     o.sillFt+o.heightFt>p.walls.heightFt+EPS)errors.push("Invalid door/window "+o.id);
  if(o.kind==="door"&&o.widthFt<2.5)errors.push("Narrow access opening "+o.id);
  if(o.connectsTo&&(!byId.has(o.connectsTo)||byId.get(o.connectsTo)?.floor!==r?.floor))errors.push("Invalid room connection "+o.id);
 }
 for(const r of p.rooms){
  for(const side of ["front","rear","left","right"] as Side[]){
   const openings=p.openings.filter(o=>o.roomId===r.id&&o.side===side);
   try{wallBoxes(side==="front"||side==="rear"?r.w:r.d,p.walls.heightFt,openings.map(o=>({atFt:o.atFt,widthFt:o.widthFt,sillFt:o.sillFt,heightFt:o.heightFt})));}
   catch{errors.push("Overlapping/out-of-bounds openings "+r.id+"/"+side)}
  }
  if(["living","bedroom","kitchen","dining"].includes(r.kind)){
   const sides=externalSide(r,p.plot,sb);
   if(!p.openings.some(o=>o.roomId===r.id&&o.kind==="window"&&sides.includes(o.side)))errors.push("No external ventilation window "+r.id);
  }
 }
 const ground=p.rooms.filter(r=>r.floor===0);
 const verandah=ground.find(r=>r.kind==="verandah");
 if(!verandah||!near(verandah.y,U.y))errors.push("Verandah not on road-facing front edge");
 if(p.gate.side!=="front"||p.gate.xFt<0||p.gate.xFt+p.gate.widthFt>w+EPS)errors.push("Road-side gate missing or invalid");
 if(p.parking){const park=byId.get(p.parking.roomId);if(!park||park.kind!=="parking"||park.floor!==0||!near(park.y,U.y)||p.parking.clearWidthFt<8||p.parking.clearDepthFt<16)errors.push("Road parking invalid");}
 if(p.stairs.roomIds.length!==p.floors||p.stairs.roomIds.some(id=>byId.get(id)?.kind!=="stairs"))errors.push("Stair circulation missing floor");
 // Connectivity graph uses actual reciprocal door coordinates; mere wall-touching is insufficient.
 const links=new Map<string,Set<string>>();
 for(const r of p.rooms)links.set(r.id,new Set());
 for(const o of p.openings.filter(o=>o.kind==="door"&&o.connectsTo)){
  const r=byId.get(o.roomId),dest=byId.get(o.connectsTo!);
  if(!r||!dest)continue;
  const edge=sharedEdge(r,dest);
  if(!edge||edge.aSide!==o.side){errors.push("Door not on actual shared wall "+o.id);continue}
  const paired=p.openings.some(other=>other.roomId===dest.id&&other.connectsTo===r.id&&other.side===edge.bSide&&other.kind==="door");
  if(!paired){errors.push("Unpaired door "+o.id);continue}
  links.get(r.id)?.add(dest.id);links.get(dest.id)?.add(r.id);
 }
 // Stair alignment is explicit vertical connectivity between two floors.
 for(let i=1;i<p.stairs.roomIds.length;i++){
  const a=byId.get(p.stairs.roomIds[i-1]),b=byId.get(p.stairs.roomIds[i]);
  if(!a||!b||!near(a.x,b.x)||!near(a.y,b.y)||!near(a.w,b.w)||!near(a.d,b.d))errors.push("Stair shafts do not align");
  if(a&&b){links.get(a.id)?.add(b.id);links.get(b.id)?.add(a.id)}
 }
 if(verandah){
  const seen=new Set([verandah.id]),queue=[verandah.id];
  for(const id of queue)for(const child of links.get(id)??[]){if(!seen.has(child)){seen.add(child);queue.push(child)}}
  for(const r of p.rooms.filter(r=>!["parking","terrace","balcony"].includes(r.kind)&&r.kind!=="verandah"))
   if(!seen.has(r.id))errors.push("No walking route from road to "+r.id);
 }
 const goal=p.notes.find(x=>x.includes("City rules"));
 if(!goal)errors.push("Missing local-rule warning");
 return [...new Set(errors)];
}
export function planMetrics(p:PlanModel,coats=2,coverageSqMPerL=10){
 if(!Number.isFinite(coats)||coats<=0||!Number.isFinite(coverageSqMPerL)||coverageSqMPerL<=0)throw new RangeError("Invalid paint estimate inputs");
 const enclosed=p.rooms.filter(r=>!["parking","verandah","balcony","terrace"].includes(r.kind));
 const roomFloorSqFt=enclosed.reduce((s,r)=>s+area(r),0);
 const parkingSqFt=p.rooms.filter(r=>r.kind==="parking").reduce((s,r)=>s+area(r),0);
 let grossWallSqFt=0,openingSqFt=0;
 for(const r of enclosed){
  grossWallSqFt+=2*(r.w+r.d)*p.walls.heightFt;
  openingSqFt+=p.openings.filter(o=>o.roomId===r.id).reduce((s,o)=>s+o.widthFt*o.heightFt,0);
 }
 const netPaintSqM=Math.max(0,grossWallSqFt-openingSqFt)*.09290304;
 return {roomFloorSqFt,parkingSqFt,netPaintSqM,paintLitres:Math.ceil(netPaintSqM*coats/coverageSqMPerL),
  note:"Preliminary room-facing paint area, not an itemised construction BOQ; shared walls are counted by room face. Confirm exterior, coverage, layers and waste on site."};
}
/** RGB preview only. Fresh output avoids cumulative loss on every palette change. */
export function recolorMasked(source:Uint8ClampedArray,mask:Uint8ClampedArray,target:readonly [number,number,number]):Uint8ClampedArray{
 if(source.length!==mask.length*4||target.some(c=>!Number.isFinite(c)||c<0||c>255))throw new RangeError("Image/mask dimensions or target invalid");
 const out=new Uint8ClampedArray(source);let sum=0,weight=0;
 for(let i=0;i<mask.length;i++){const a=mask[i]/255;if(!a)continue;const j=i*4;
  sum+=(.2126*source[j]+.7152*source[j+1]+.0722*source[j+2])*a;weight+=a;}
 if(weight===0)return out;const ref=Math.max(8,sum/weight);
 for(let i=0;i<mask.length;i++){const a=mask[i]/255;if(!a)continue;const j=i*4;
  const lum=.2126*source[j]+.7152*source[j+1]+.0722*source[j+2];
  const factor=Math.min(1.75,Math.max(.25,lum/ref));
  for(let c=0;c<3;c++)out[j+c]=Math.min(255,source[j+c]*(1-a)+target[c]*factor*a);
 }
 return out;
}
