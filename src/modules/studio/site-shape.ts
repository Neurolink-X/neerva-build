/** Conservative planning envelope for a measured L-shaped roadside plot.
 * No algorithm may treat the missing rear corner as owned land.
 * These are user-provided boundary dimensions, NOT a cadastral survey or setback approval.
 */
export type SiteShape=
 | {kind:"rectangle"}
 | {kind:"rear-left-notch"|"rear-right-notch";notchWidthFt:number;notchDepthFt:number};
export type SitePoint={x:number;y:number};
export const rectangleSite:SiteShape={kind:"rectangle"};
export function shapeErrors(widthFt:number,depthFt:number,shape:SiteShape):string[]{
 if(shape.kind==="rectangle")return [];
 if(![widthFt,depthFt,shape.notchWidthFt,shape.notchDepthFt].every(Number.isFinite))
  return ["All plot and notch dimensions must be finite."];
 if(shape.notchWidthFt<1||shape.notchDepthFt<1)
  return ["Notch width and depth must each be at least 1 ft."];
 if(shape.notchWidthFt>=widthFt*.45||shape.notchDepthFt>=depthFt*.45)
  return ["The excluded rear corner is too large for this conservative L-plot template; request an architect survey."];
 return [];
}
export function siteOutline(widthFt:number,depthFt:number,shape:SiteShape):SitePoint[]{
 const W=widthFt,D=depthFt;
 if(shape.kind==="rectangle")return [{x:0,y:0},{x:W,y:0},{x:W,y:D},{x:0,y:D}];
 const w=shape.notchWidthFt,d=shape.notchDepthFt;
 return shape.kind==="rear-left-notch"
  ?[{x:0,y:0},{x:W,y:0},{x:W,y:D},{x:w,y:D},{x:w,y:D-d},{x:0,y:D-d}]
  :[{x:0,y:0},{x:W,y:0},{x:W,y:D-d},{x:W-w,y:D-d},{x:W-w,y:D},{x:0,y:D}];
}
export function conservativeEnvelope(widthFt:number,depthFt:number,shape:SiteShape,
 setbacks:{leftFt:number;rightFt:number;frontFt:number;rearFt:number}){
 if(shape.kind==="rectangle")return {...setbacks};
 // Exclude the entire side-strip of the rear notch from ALL room floors.
 // Less usable area than an architect might achieve, but never builds on missing land.
 return {...setbacks,
  leftFt:shape.kind==="rear-left-notch"?Math.max(setbacks.leftFt,shape.notchWidthFt):setbacks.leftFt,
  rightFt:shape.kind==="rear-right-notch"?Math.max(setbacks.rightFt,shape.notchWidthFt):setbacks.rightFt};
}
export function rectInsideShape(room:{x:number;y:number;w:number;d:number},widthFt:number,depthFt:number,shape:SiteShape):boolean{
 if(room.x<0||room.y<0||room.x+room.w>widthFt+1e-6||room.y+room.d>depthFt+1e-6)return false;
 if(shape.kind==="rectangle")return true;
 const w=shape.notchWidthFt,d=shape.notchDepthFt;
 if(room.y+room.d<=depthFt-d+1e-6)return true;
 return shape.kind==="rear-left-notch"?room.x>=w-1e-6:room.x+room.w<=widthFt-w+1e-6;
}
export function siteAreaSqFt(widthFt:number,depthFt:number,shape:SiteShape):number{
 return widthFt*depthFt-(shape.kind==="rectangle"?0:shape.notchWidthFt*shape.notchDepthFt);
}

/** Parse shared plot links without silently treating an invalid shape as rectangular. */
export function parseSiteShape(kind:unknown,notchWidth:unknown,notchDepth:unknown):SiteShape|null{
 if(kind===undefined||kind==="rectangle")return rectangleSite;
 if(kind!=="rear-left-notch"&&kind!=="rear-right-notch")return null;
 if(typeof notchWidth!=="string"||typeof notchDepth!=="string"||!notchWidth.trim()||!notchDepth.trim())return null;
 const notchWidthFt=Number(notchWidth),notchDepthFt=Number(notchDepth);
 if(!Number.isFinite(notchWidthFt)||!Number.isFinite(notchDepthFt)||notchWidthFt<1||notchDepthFt<1)return null;
 return {kind,notchWidthFt,notchDepthFt};
}
/** Boundary edges excluding the road edge: shared by site geometry and 3D fence. */
export function nonRoadBoundaryEdges(widthFt:number,depthFt:number,shape:SiteShape){
 const points=siteOutline(widthFt,depthFt,shape);
 return points.map((start,i)=>({start,end:points[(i+1)%points.length]})).filter(e=>!(e.start.y===0&&e.end.y===0));
}
