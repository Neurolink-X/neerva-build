import type {MaskCorner} from "./mask-editor.ts";
/** Keep artwork's 3:2 reference composition inside a flat wall without squeezing
 * circles or leaves. For oblique photos the edge-length estimate is approximate.
 * Full-bleed patterns and material textures deliberately fill their wall. */
export function artworkFrame(corners:readonly MaskCorner[],contain:boolean,visibleHeight=1){
 if(!contain||corners.length!==4)return {u:0,v:0,w:1,h:1};
 const [a,b,c,d]=corners;
 const visible=Math.max(.1,Math.min(1,visibleHeight));
 const dist=(p:MaskCorner,q:MaskCorner)=>Math.hypot(p.x-q.x,p.y-q.y);
 const width=(dist(a,b)+dist(d,c))/2,height=(dist(a,d)+dist(b,c))/2*visible;
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)return {u:0,v:0,w:1,h:1};
 const aspect=width/height,reference=1.5,w=Math.min(1,reference/aspect),h=Math.min(1,aspect/reference);
 return {u:(1-w)/2,v:(1-h)*visible/2,w,h:h*visible};
}
