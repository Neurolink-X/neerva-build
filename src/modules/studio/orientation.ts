import type {RoadSide,Rect} from "./plan-model.ts";
/** Single compass projection: local +y is away from the road; global +y points south.
 * N: road top, E: road right, S: road bottom, W: road left.
 * Geometry is never stretched. Rotated frontage/depth exchange for E/W.
 */
export type Point={x:number;y:number};
export type SiteProjection={widthFt:number;depthFt:number;svgMatrix:string;roadEdge:"top"|"right"|"bottom"|"left"};
export function projectPoint(point:Point,frontageFt:number,depthFt:number,side:RoadSide):Point{
 const {x,y}=point;
 switch(side){
  case "N":return{x,y};
  case "E":return{x:depthFt-y,y:x};
  case "S":return{x:frontageFt-x,y:depthFt-y};
  case "W":return{x:y,y:frontageFt-x};
 }
}
export function projectRect(r:Rect,frontageFt:number,depthFt:number,side:RoadSide):Rect{
 const corners=[{x:r.x,y:r.y},{x:r.x+r.w,y:r.y},{x:r.x,y:r.y+r.d},{x:r.x+r.w,y:r.y+r.d}].map(p=>projectPoint(p,frontageFt,depthFt,side));
 const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);
 return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),d:Math.max(...ys)-Math.min(...ys)};
}
export function siteProjection(frontageFt:number,depthFt:number,side:RoadSide):SiteProjection{
 if(![frontageFt,depthFt].every(n=>Number.isFinite(n)&&n>0))throw new RangeError("Invalid plot dimensions");
 switch(side){
  case "N":return{widthFt:frontageFt,depthFt,svgMatrix:"matrix(1 0 0 1 0 0)",roadEdge:"top"};
  case "E":return{widthFt:depthFt,depthFt:frontageFt,svgMatrix:`matrix(0 1 -1 0 ${depthFt} 0)`,roadEdge:"right"};
  case "S":return{widthFt:frontageFt,depthFt,svgMatrix:`matrix(-1 0 0 -1 ${frontageFt} ${depthFt})`,roadEdge:"bottom"};
  case "W":return{widthFt:depthFt,depthFt:frontageFt,svgMatrix:`matrix(0 -1 1 0 0 ${frontageFt})`,roadEdge:"left"};
 }
}
