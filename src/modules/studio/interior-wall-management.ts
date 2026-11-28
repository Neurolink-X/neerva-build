import type {MaskCorner} from "./mask-editor.ts";
import type {PaintStyle,PhotoMask} from "./facade-paint.ts";
export type InteriorWall=Omit<PaintStyle,"opacity">&{opacity?:number;points:MaskCorner[];mask?:PhotoMask};
/** Commit the active wall before moving selection. Never duplicate an edited wall. */
export function commitInteriorWall(walls:readonly InteriorWall[],editing:number|null,wall:InteriorWall|null):InteriorWall[]{
 if(!wall)return [...walls];
 return editing!==null&&editing>=0&&editing<walls.length?walls.map((old,i)=>i===editing?wall:old):[...walls,wall];
}
/** All-wall paint only changes base shades. A feature wall's artwork and intensity remain independent. */
export function repaintInteriorWalls(walls:readonly InteriorWall[],colour:string,initial:string):InteriorWall[]{
 return colour===initial?[...walls]:walls.map(w=>({...w,colour}));
}
export function wallDetailCorners(points:readonly MaskCorner[],width:number,height:number):MaskCorner[]{
 if(points.length!==4||width<1||height<1)return [];
 const dist=(a:MaskCorner,b:MaskCorner)=>Math.hypot((a.x-b.x)*width,(a.y-b.y)*height);
 const [a,b,c,d]=points,ratio=(dist(a,b)+dist(d,c))/Math.max(1,dist(a,d)+dist(b,c));
 const aspect=Math.max(.25,Math.min(4,ratio)),w=Math.min(.92,.92*height*aspect/width),h=Math.min(.92,.92*width/(aspect*height));
 const x=(1-w)/2,y=(1-h)/2;return [{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
}
export function wallContainsPoint(points:readonly MaskCorner[],p:MaskCorner){
 let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;
}

/** A saved exclusion mask belongs to its original four corners, never a changed selection. */
export function matchingWallCorners(a:readonly MaskCorner[],b:readonly MaskCorner[]){return a.length===4&&b.length===4&&a.every((p,i)=>p.x===b[i].x&&p.y===b[i].y);}
