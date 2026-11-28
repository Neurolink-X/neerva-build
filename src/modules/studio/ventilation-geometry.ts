import {isOtsRoom,type PlanModel,type Side} from "./plan-model.ts";
import {windowExposure} from "./ventilation.ts";
export function modeledWindowGeometry(plan:PlanModel,floor?:number,heightLimit=plan.walls.heightFt){
 return plan.openings.flatMap(o=>{
  if(o.kind!=="window")return [];
  const room=plan.rooms.find(r=>r.id===o.roomId);if(!room||floor!==undefined&&room.floor!==floor)return [];
  const top=Math.min(heightLimit,o.sillFt+o.heightFt);if(top<=o.sillFt+.001)return [];
  const vertical=o.side==="left"||o.side==="right";
  const plane=vertical?room.x+(o.side==="right"?room.w:0):room.y+(o.side==="rear"?room.d:0);
  const start=(vertical?room.y:room.x)+o.atFt;
  return [{id:o.id,roomId:room.id,floor:room.floor,side:o.side,atFt:o.atFt,widthFt:o.widthFt,vertical,plane,start,end:start+o.widthFt,bottom:o.sillFt,top,exposure:windowExposure(plan,room,o),added:o.id.startsWith("vent-v1-")||o.id.startsWith("ots-v1-window-")}];
 });
}
export function ventilationGeometrySummary(plan:PlanModel,floor?:number,heightLimit=plan.walls.heightFt){
 const full=modeledWindowGeometry(plan,floor),visible=modeledWindowGeometry(plan,floor,heightLimit);
 return {windows:full.length,visible:visible.length,screened:full.filter(o=>o.exposure!=="review").length,added:full.filter(o=>o.added).length,shaft:plan.rooms.some(r=>isOtsRoom(r)&&(floor===undefined||r.floor===floor))};
}
export function windowGeometryKey(roomId:string,side:Side,atFt:number,widthFt:number){return [roomId,side,atFt,widthFt].join(":");}
