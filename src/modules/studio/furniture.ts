import {overlapArea,type PlanModel,type Rect,type Room} from "./plan-model.ts";
export type FurniturePiece=Rect&{id:string;roomId:string;floor:number;kind:"bed"|"sofa"|"counter"|"table"|"wardrobe";heightFt:number};
const specs:Record<string,readonly [FurniturePiece["kind"],number,number,number][]>={
 bedroom:[["bed",5,6.5,1.6],["wardrobe",3,1.8,6]],
 living:[["sofa",6,2.5,2.7],["table",3,1.8,1.5]],
 lounge:[["sofa",5,2.5,2.7],["table",3,1.8,1.5]],
 dining:[["table",4,3,2.5]],
 kitchen:[["counter",6,2,3]]
};
export function openingClearances(plan:PlanModel,r:Room):Rect[]{
 return plan.openings.filter(o=>o.roomId===r.id).map(o=>{
  const depth=o.kind==="door"?o.widthFt+.5:.5;
  const start=Math.max(0,o.atFt-.25),end=Math.min(o.side==="front"||o.side==="rear"?r.w:r.d,o.atFt+o.widthFt+.25);
  if(o.side==="front")return {x:r.x+start,y:r.y,w:end-start,d:Math.min(depth,r.d)};
  if(o.side==="rear")return {x:r.x+start,y:r.y+r.d-Math.min(depth,r.d),w:end-start,d:Math.min(depth,r.d)};
  if(o.side==="left")return {x:r.x,y:r.y+start,w:Math.min(depth,r.w),d:end-start};
  return {x:r.x+r.w-Math.min(depth,r.w),y:r.y+start,w:Math.min(depth,r.w),d:end-start};
 });
}
/** Real compact furniture sizes; no arbitrary scaling. Prefer the original
 * full-size item, then a smaller standard concept footprint if necessary. */
const compact:Partial<Record<FurniturePiece["kind"],readonly [number,number][]>>={
 bed:[[4.5,6.25],[4,6.25],[3,6.25]],sofa:[[4.5,2.5],[3.5,2.25]],table:[[2.5,2],[2,2]],wardrobe:[[2,1.8]],counter:[[5,2],[4,2]]
};
const essential:Partial<Record<Room["kind"],FurniturePiece["kind"]>>={bedroom:"bed",living:"sofa",lounge:"sofa",dining:"table",kitchen:"counter"};
function positions(r:Room,w:number,d:number):Rect[]{
 const x0=r.x+.5,x1=r.x+r.w-.5-w,y0=r.y+.5,y1=r.y+r.d-.5-d;
 if(x1<x0-1e-6||y1<y0-1e-6)return [];
 const xs=[x0,x1,(x0+x1)/2],ys=[y0,y1,(y0+y1)/2];
 // Bounded wall-aligned and intermediate positions; independent of plot size.
 for(let i=1;i<5;i++){xs.push(x0+(x1-x0)*i/5);ys.push(y0+(y1-y0)*i/5);}
 const out:Rect[]=[],seen=new Set<string>();
 for(const x of xs)for(const y of ys){const key=x.toFixed(5)+":"+y.toFixed(5);if(!seen.has(key)){seen.add(key);out.push({x,y,w,d});}}
 return out;
}
type State={pieces:FurniturePiece[];score:number};
/** Bounded beam search places important furniture first, while allowing a
 * different position if it permits a complete furniture set. No obstruction
 * of modeled door/window buffers; not a wheelchair or egress certification. */
export function planFurniture(plan:PlanModel):FurniturePiece[]{
 const result:FurniturePiece[]=[];
 for(const r of plan.rooms){
  const reserved=openingClearances(plan,r);
  let states:State[]=[{pieces:[],score:0}];
  for(const [kind,width,depth,heightFt] of specs[r.kind]??[]){
   const alternatives=[[width,depth] as const,...(compact[kind]??[])],choices:{box:Rect;score:number}[]=[];
   for(const [index,[a,b]] of alternatives.entries())for(const [w,d] of a===b?[[a,b]]:[[a,b],[b,a]]){
    for(const box of positions(r,w,d)){
     if(reserved.some(q=>overlapArea(box,q)>1e-6))continue;
     const edge=Math.min(box.x-r.x,r.x+r.w-box.x-box.w,box.y-r.y,r.y+r.d-box.y-box.d);
     choices.push({box,score:(essential[r.kind]===kind?1000:100)-index*4-Math.max(0,edge-.5)*.3});
    }
   }
   const expanded:State[]=[];
   for(const state of states){
    expanded.push(state);
    for(const {box,score} of choices){
     if(state.pieces.some(q=>overlapArea(box,{x:q.x-.35,y:q.y-.35,w:q.w+.7,d:q.d+.7})>1e-6))continue;
     expanded.push({pieces:[...state.pieces,{...box,id:r.id+"-"+kind,roomId:r.id,floor:r.floor,kind,heightFt}],score:state.score+score});
    }
   }
   expanded.sort((a,b)=>b.score-a.score);
   // Keep several genuinely different positions instead of exhausting a large grid.
   const seen=new Set<string>();states=[];
   for(const state of expanded){
    const key=state.pieces.map(q=>[q.kind,Math.round(q.x*2),Math.round(q.y*2),q.w,q.d].join(":")).join("|");
    if(seen.has(key))continue;seen.add(key);states.push(state);if(states.length===12)break;
   }
  }
  result.push(...states[0].pieces);
 }
 return result;
}
export function interiorFitReport(plan:PlanModel){
 const pieces=planFurniture(plan);
 const rows=plan.rooms.filter(r=>essential[r.kind]).map(r=>{
  const placed=pieces.filter(p=>p.roomId===r.id),required=essential[r.kind]!;
  return {id:r.id,label:r.label,floor:r.floor,required,ready:placed.some(p=>p.kind===required),pieces:placed};
 });
 return {rows,pieces,ready:rows.filter(r=>r.ready).length,total:rows.length};
}
export function preservesEssentialInterior(before:ReturnType<typeof interiorFitReport>,after:ReturnType<typeof interiorFitReport>){
 const ready=new Set(after.rows.filter(r=>r.ready).map(r=>r.id));
 return before.rows.every(r=>!r.ready||ready.has(r.id));
}
