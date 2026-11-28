/** Browser-only polygon editor. Coordinates are normalized to the decoded photo. */
export type MaskCorner={x:number;y:number};
export type MaskHistory={points:MaskCorner[];redo:MaskCorner[]};
export const emptyMaskHistory=():MaskHistory=>({points:[],redo:[]});
const finite=(p:MaskCorner)=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
export function polygonArea(points:readonly MaskCorner[]):number{
 if(points.length<3)return 0;
 return Math.abs(points.reduce((a,p,i)=>{const q=points[(i+1)%points.length];return a+p.x*q.y-q.x*p.y},0))/2;
}
function cross(a:MaskCorner,b:MaskCorner,c:MaskCorner){
 return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
}
function intersect(a:MaskCorner,b:MaskCorner,c:MaskCorner,d:MaskCorner){
 const e=1e-8,x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);
 return x*y < -e && z*w < -e;
}
export function validWallMask(points:readonly MaskCorner[]):boolean{
 if(points.length!==4||points.some(p=>!finite(p)))return false;
 const distinct=points.every((p,i)=>points.every((q,j)=>i===j||Math.hypot(p.x-q.x,p.y-q.y)>.008));
 if(!distinct||polygonArea(points)<.002)return false;
 if(intersect(points[0],points[1],points[2],points[3])||intersect(points[1],points[2],points[3],points[0]))return false;
 const turns=points.map((p,i)=>cross(p,points[(i+1)%4],points[(i+2)%4]));
 return turns.every(t=>t>1e-6)||turns.every(t=>t< -1e-6);
}
export function addCorner(history:MaskHistory,point:MaskCorner):MaskHistory{
 if(history.points.length>=4||!finite(point))return history;
 return{points:[...history.points,point],redo:[]};
}
export function undoCorner(history:MaskHistory):MaskHistory{
 if(!history.points.length)return history;
 return{points:history.points.slice(0,-1),redo:[...history.redo,history.points[history.points.length-1]]};
}
export function redoCorner(history:MaskHistory):MaskHistory{
 if(!history.redo.length||history.points.length>=4)return history;
 return{points:[...history.points,history.redo[history.redo.length-1]],redo:history.redo.slice(0,-1)};
}
