import {type StudioDesign,wallPatches} from "./library.ts";
export type WallCell={axis:"x"|"z";floorIndex:number;planeFt:number;startFt:number;endFt:number;bottomFt:number;topFt:number};
type Rect={start:number;end:number;bottom:number;top:number};
type Group={axis:"x"|"z";floorIndex:number;planeFt:number;patches:Rect[];holes:Rect[]};
const close=(a:number,b:number)=>Math.abs(a-b)<.001;
const unique=(values:number[])=>values.sort((a,b)=>a-b).filter((v,i,all)=>i===0||!close(v,all[i-1]));
export function buildingWallCells(design:StudioDesign):WallCell[]{
 const groups=new Map<string,Group>();
 function group(axis:"x"|"z",floorIndex:number,planeFt:number){const key=floorIndex+":"+axis+":"+planeFt.toFixed(3);let g=groups.get(key);if(!g){g={axis,floorIndex,planeFt,patches:[],holes:[]};groups.set(key,g)}return g;}
 for(const room of design.layout.rooms){if(room.kind==="open"||room.kind==="parking")continue;
  for(const patch of wallPatches(room,design.layout.wallHeightFt)){const side=patch.side,axis=side==="front"||side==="rear"?"z":"x",planeFt=axis==="z"?room.yFt+(side==="rear"?room.dFt:0):room.xFt+(side==="right"?room.wFt:0),shift=axis==="z"?room.xFt:room.yFt;
   group(axis,room.floorIndex,planeFt).patches.push({start:shift+patch.startFt,end:shift+patch.endFt,bottom:patch.bottomFt,top:patch.topFt});}
  for(const opening of room.openings){const side=opening.wall,axis=side==="front"||side==="rear"?"z":"x",planeFt=axis==="z"?room.yFt+(side==="rear"?room.dFt:0):room.xFt+(side==="right"?room.wFt:0),shift=axis==="z"?room.xFt:room.yFt;
   group(axis,room.floorIndex,planeFt).holes.push({start:shift+opening.offsetFt,end:shift+opening.offsetFt+opening.widthFt,bottom:opening.sillFt,top:opening.sillFt+opening.heightFt});}
 }
 const cells:WallCell[]=[];for(const g of groups.values()){
  const xs=unique([...g.patches.flatMap(p=>[p.start,p.end]),...g.holes.flatMap(h=>[h.start,h.end])]);
  const ys=unique([...g.patches.flatMap(p=>[p.bottom,p.top]),...g.holes.flatMap(h=>[h.bottom,h.top])]);
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
   const startFt=xs[i],endFt=xs[i+1],bottomFt=ys[j],topFt=ys[j+1];if(endFt-startFt<.001||topFt-bottomFt<.001)continue;
   const midX=(startFt+endFt)/2,midY=(bottomFt+topFt)/2;
   const contains=(p:Rect)=>midX>p.start-.001&&midX<p.end+.001&&midY>p.bottom-.001&&midY<p.top+.001;
   if(g.patches.some(contains)&&!g.holes.some(contains))cells.push({axis:g.axis,floorIndex:g.floorIndex,planeFt:g.planeFt,startFt,endFt,bottomFt,topFt});
  }
 }
 return cells;
}
export function structuralFootprint(design:StudioDesign){
 const rooms=design.layout.rooms.filter(r=>r.floorIndex===0&&r.kind!=="open"&&r.kind!=="parking");
 return {minX:Math.min(...rooms.map(r=>r.xFt)),maxX:Math.max(...rooms.map(r=>r.xFt+r.wFt)),minZ:Math.min(...rooms.map(r=>r.yFt)),maxZ:Math.max(...rooms.map(r=>r.yFt+r.dFt))};
}
/** One view contract for WebGL and the accessible SVG fallback. Clipping never
 * changes the underlying construction concept or its saved geometry digest. */
export function visibleWallCells(design:StudioDesign,floor?:number,cutaway=false):WallCell[]{
 const ceiling=cutaway?design.layout.wallHeightFt*.46:design.layout.wallHeightFt;
 return buildingWallCells(design).filter(c=>(floor===undefined||c.floorIndex===floor)&&c.bottomFt<ceiling-.001)
  .map(c=>({...c,topFt:Math.min(c.topFt,ceiling)}));
}
