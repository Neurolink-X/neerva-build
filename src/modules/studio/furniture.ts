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
/** Indicative furniture only. Never shrink a piece to fake a fit; skip it if
 * a conservative opening buffer or another piece would be obstructed. */
export function planFurniture(plan:PlanModel):FurniturePiece[]{
 const result:FurniturePiece[]=[];
 for(const r of plan.rooms){
  const pieces:FurniturePiece[]=[],reserved=openingClearances(plan,r);
  for(const [kind,width,depth,heightFt] of specs[r.kind]??[]){
   let found:Rect|undefined;
   const margin=.5;
   for(const [w,d] of [[width,depth],[depth,width]]){
    const x0=r.x+margin,x1=r.x+r.w-margin-w,y0=r.y+margin,y1=r.y+r.d-margin-d;
    if(x1<x0||y1<y0)continue;
    for(const [x,y] of [[x0,y1],[x1,y1],[x0,y0],[x1,y0],[(x0+x1)/2,y1],[x0,(y0+y1)/2],[(x0+x1)/2,(y0+y1)/2]]){
     const box={x,y,w,d};
     if(reserved.some(b=>overlapArea(box,b)>1e-6)||pieces.some(b=>overlapArea(box,{x:b.x-.35,y:b.y-.35,w:b.w+.7,d:b.d+.7})>1e-6))continue;
     found=box;break;
    }
    if(found)break;
   }
   if(found)pieces.push({...found,id:r.id+"-"+kind,roomId:r.id,floor:r.floor,kind,heightFt});
  }
  result.push(...pieces);
 }
 return result;
}
