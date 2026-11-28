import {buildingWallCells} from "./geometry.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {exposedRoofPatches,isEnclosedRoom} from "./plan-surfaces.ts";
import {facadeAccents} from "./frontage.ts";
import {isOtsRoom,type PlanModel} from "./plan-model.ts";
import {otsGrilleBars,otsGrilleLevel} from "./ots-ventilation.ts";
import type {RenderBox,RenderSnapshot,Vec3} from "../../../public/studio-render-v1";

const FT=.3048;
const rgb=(s:string):Vec3=>{const h=/^#[0-9a-f]{6}$/i.test(s)?s:"#d9d5cd";return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255) as Vec3};
const unit=(a:Vec3):Vec3=>{const m=Math.hypot(...a)||1;return a.map(v=>v/m) as Vec3};
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
/** Road-relative render from exact room/wall/opening data; no WebGL context,
 * stock facade, fake balconies or third-party renderer required. Feet to metres. */
export function streetRenderSnapshot(p:PlanModel,glass="#94b6c5",view:"front"|"corner"="corner",evening=false):RenderSnapshot{
 const boxes:RenderBox[]=[],H=p.walls.heightFt,W=p.plot.widthFt,D=p.plot.depthFt;
 const put=(x:number,y:number,z:number,w:number,h:number,d:number,shade:string,rough=.72,metal=0,opacity=1,finish:RenderBox["finish"]="plain")=>{
  if(Math.min(w,h,d)<=0||![x,y,z,w,h,d].every(Number.isFinite))return;
  boxes.push({lo:[x*FT,y*FT,z*FT],hi:[(x+w)*FT,(y+h)*FT,(z+d)*FT],color:rgb(shade),rough,metal,opacity,finish});
 };
 const shape=p.plot.siteShape??{kind:"rectangle"} as const;
 if(shape.kind==="rectangle")put(0,-.28,0,W,.25,D,"#bcb7a7");
 else{put(0,-.28,0,W,.25,D-shape.notchDepthFt,"#bcb7a7");
  const left=shape.kind==="rear-left-notch"?shape.notchWidthFt:0;
  put(left,-.28,D-shape.notchDepthFt,W-shape.notchWidthFt,.25,shape.notchDepthFt,"#bcb7a7");
 }
 // Context only: pavement and public street outside the measured plot.
 put(-W,-.32,-10,W*3,.22,10,"#777d7c");put(-W,-.1,-2.5,W*3,.08,2.5,"#c9c5b9",.9);
 for(const c of buildingWallCells(studioDesignFromPlan(p))){
  const t=p.walls.internalFt,y=c.floorIndex*H+c.bottomFt,h=c.topFt-c.bottomFt,len=c.endFt-c.startFt;
  if(c.axis==="x")put(c.planeFt-t/2,y,c.startFt,t,h,len,p.facade.main);
  else put(c.startFt,y,c.planeFt-t/2,len,h,t,p.facade.main);
 }
 for(const r of p.rooms.filter(r=>r.kind!=="parking"&&(!isOtsRoom(r)||r.floor===0)))put(r.x,r.floor*H-.12,r.y,r.w,.24,r.d,"#d6d0c2");
 for(const r of exposedRoofPatches(p))put(r.x,r.floor*H-.12,r.y,r.w,.24,r.d,"#d8d2c5");
 // Parapets are only on exposed top-room edges, not across the roof shaft.
 const topRooms=p.rooms.filter(r=>r.floor===p.floors-1&&isEnclosedRoom(r));
 for(const r of topRooms){
  for(const side of ["front","rear","left","right"] as const){
   const horizontal=side==="front"||side==="rear",plane=horizontal?r.y+(side==="rear"?r.d:0):r.x+(side==="right"?r.w:0);
   const start=horizontal?r.x:r.y,end=start+(horizontal?r.w:r.d);
   const adjacent=topRooms.filter(s=>s.id!==r.id&&Math.abs((horizontal?s.y+(side==="front"?s.d:0):s.x+(side==="left"?s.w:0))-plane)<.001).map(s=>[horizontal?s.x:s.y,(horizontal?s.x+s.w:s.y+s.d)] as const);
   const cuts=[start,end,...adjacent.flatMap(([a,b])=>[Math.max(start,a),Math.min(end,b)]).filter(v=>v>start&&v<end)].sort((a,b)=>a-b);
   for(let i=1;i<cuts.length;i++){const a=cuts[i-1],b=cuts[i],mid=(a+b)/2;if(b-a<.001||adjacent.some(([lo,hi])=>mid>lo&&mid<hi))continue;
    if(horizontal)put(a,p.floors*H+.12,plane-.12,b-a,p.walls.parapetFt,.24,p.facade.accent);
    else put(plane-.12,p.floors*H+.12,a,.24,p.walls.parapetFt,b-a,p.facade.accent);
   }
  }
 }
 const grille=otsGrilleLevel(p);if(grille!==null)for(const bar of otsGrilleBars(p))put(bar.x,grille*H+.12,bar.y,bar.w,.12,bar.d,"#37443e",.35,.5);
 for(const o of p.openings){
  const r=p.rooms.find(r=>r.id===o.roomId);if(!r||!isEnclosedRoom(r))continue;
  if(o.kind==="door"&&o.connectsTo)continue;
  const vertical=o.side==="left"||o.side==="right",plane=vertical?r.x+(o.side==="right"?r.w:0):r.y+(o.side==="rear"?r.d:0);
  const start=(vertical?r.y:r.x)+o.atFt,y=r.floor*H+o.sillFt,t=.12;
  const panel=(a:number,b:number,w:number,h:number,shade:string,rough:number,metal:number,opacity=1,finish:RenderBox["finish"]="plain")=>vertical?put(plane-t/2,b,a,t,h,w,shade,rough,metal,opacity,finish):put(a,b,plane-t/2,w,h,t,shade,rough,metal,opacity,finish);
  panel(start,y,o.widthFt,o.heightFt,o.kind==="window"?glass:"#765742",o.kind==="window"?.18:.55,o.kind==="window"?.15:0,o.kind==="window"?.7:1,o.kind==="door"?"wood":"plain");
  if(o.kind==="window"){const f=.12;for(const a of [start,start+o.widthFt-f])panel(a,y,f,o.heightFt,"#34433f",.3,.5);
   for(const b of [y,y+o.heightFt-f])panel(start,b,o.widthFt,f,"#34433f",.3,.5);
   if(o.widthFt>2.5)panel(start+o.widthFt/2-f/2,y,f,o.heightFt,"#34433f",.3,.5);
  }
 }
 for(const a of facadeAccents(p))put(a.x,a.y,a.z-a.d,a.w,a.h,a.d,p.facade.accent,.52,0,1,p.facade.kit==="jali-screen"?"wood":"plain");
 for(const r of p.rooms.filter(r=>r.kind==="balcony")){
  put(r.x,r.floor*H,r.y,r.w,2.8,.12,glass,.18,.15,.65);
  put(r.x,r.floor*H+2.8,r.y,r.w,.13,.18,"#34433f",.32,.4);
 }
 for(const gate of [p.gate,p.pedestrianGate].filter(g=>g.widthFt>0)){
  put(gate.xFt,0,0,gate.widthFt,.3,.16,"#3c4941",.45,.3);
  put(gate.xFt,3.7,0,gate.widthFt,.2,.16,"#3c4941",.45,.3);
  const count=Math.max(2,Math.ceil(gate.widthFt/.45));for(let i=0;i<=count;i++)put(gate.xFt+Math.min(gate.widthFt-.12,i*gate.widthFt/count),.3,0,.12,3.4,.16,"#3c4941",.45,.3);
 }
 const height=p.floors*H+p.walls.parapetFt,dist=Math.max(W,height)*1.65;
 const origin:Vec3=[(W/2+(view==="corner"?dist*.24:0))*FT,(height*.48+4)*FT,-dist*FT];
 const target:Vec3=[W/2*FT,height*.48*FT,Math.min(4,D*.12)*FT];
 const forward=unit(target.map((n,i)=>n-origin[i]) as Vec3),right=unit(cross(forward,[0,1,0])),up=unit(cross(right,forward));
 return {boxes,camera:{origin,forward,right,up,fov:43,aspect:1.5},evening};
}
