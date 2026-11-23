import type {RoadSide,Rect} from "./plan-model.ts";
/** Survey-free coordinate convention:
 * Site-local y=0 is always the access-road edge; compass north is top.
 * Coordinates are feet and rotated as a single transform for plan and 3D.
 * N = upper, E = right, S = bottom, W = left.
 */
export type Pt={x:number;y:number};
export function siteDimensions(w:number,d:number,side:RoadSide){
 if(!Number.isFinite(w)||!Number.isFinite(d)||w<=0||d<=0)throw new RangeError("Invalid plot dimensions");
 return side==="E"||side==="W"?{w:d,d:w}:{w,d};
}
export function roadPoint(p:Pt,w:number,d:number,side:RoadSide):Pt{
 switch(side){
 case "N":return {...p};
 case "E":return {x:d-p.y,y:p.x};
 case "S":return {x:w-p.x,y:d-p.y};
 case "W":return {x:p.y,y:w-p.x};
 }
}
export function roadRect(r:Rect,w:number,d:number,side:RoadSide):Rect{
 const a=roadPoint({x:r.x,y:r.y},w,d,side);
 const b=roadPoint({x:r.x+r.w,y:r.y+r.d},w,d,side);
 return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),d:Math.abs(b.y-a.y)};
}
export function roadSegment(w:number,d:number,side:RoadSide){
 return {start:roadPoint({x:0,y:0},w,d,side),end:roadPoint({x:w,y:0},w,d,side)};
}
export function threeRoadRotation(side:RoadSide):number{
 return {N:0,E:-Math.PI/2,S:Math.PI,W:Math.PI/2}[side];
}
