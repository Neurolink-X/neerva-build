import data from "./designs.json" with { type: "json" };
export type Opening={kind:"door"|"window";wall:"front"|"rear"|"left"|"right";offsetFt:number;widthFt:number;sillFt:number;heightFt:number};
export type DesignRoom={id:string;label:string;kind:"living"|"kitchen"|"bedroom"|"bath"|"stairs"|"open"|"utility"|"parking";floorIndex:number;xFt:number;yFt:number;wFt:number;dFt:number;openings:Opening[]};
export type StudioDesign={id:string;slug:string;title:string;titleHi:string;style:string;plot:{widthFt:number;depthFt:number;areaSqFt:number};facing:"North"|"South"|"East"|"West";floors:number;bedrooms:number;bathrooms:number;parking:boolean;hasCourtyard:boolean;roof:"flat-rcc";layout:{version:number;rooms:DesignRoom[];wallThicknessFt:number;wallHeightFt:number;parapetHeightFt:number};elevation:{mass:string;surfaces:Record<"main"|"accent"|"cladding"|"railing"|"gate"|"frame"|"boundary",string>;finishes:string[];viewModes:string[]};areas:{carpetSqFt:number;builtUpSqFt:number};costRangePerSqFt:{minInr:number|null;maxInr:number|null;status:"pending-admin-verification"|"verified"};vastuNote:string;model:{format:string;source:string;roofType:string;openingsFromRooms:boolean};conceptOnly:true};
export const studioDesigns:readonly StudioDesign[]=data.designs as unknown as StudioDesign[];
export const studioStyles=[{id:"warm-modern",label:"Warm modern"},{id:"sandstone-calm",label:"Sandstone calm"},{id:"urban-slate",label:"Urban slate"},{id:"terracotta-ivory",label:"Terracotta & ivory"}] as const;
export const findStudioDesign=(slug:string)=>studioDesigns.find(d=>d.slug===slug);
export const formatLevels=(floors:number)=>floors===1?"Ground":("G+"+(floors-1));
export const formatPlot=(d:StudioDesign)=>d.plot.widthFt+" × "+d.plot.depthFt+" ft";
export function validateStudioDesign(d:StudioDesign):string[]{const errors:string[]=[],{plot,layout,areas}=d;
 if(plot.areaSqFt!==plot.widthFt*plot.depthFt)errors.push("Plot area mismatch");
 if(d.roof!=="flat-rcc"||layout.parapetHeightFt<=0)errors.push("Invalid default roof");
 if(areas.carpetSqFt>areas.builtUpSqFt)errors.push("Carpet exceeds built-up");
 if(d.bedrooms!==layout.rooms.filter(r=>r.kind==="bedroom").length)errors.push("Bedroom count mismatch");
 for(const r of layout.rooms){
  if(r.floorIndex<0||r.floorIndex>=d.floors||r.xFt<0||r.yFt<0||r.wFt<=0||r.dFt<=0||r.xFt+r.wFt>plot.widthFt+.001||r.yFt+r.dFt>plot.depthFt+.001)errors.push("Room outside plot: "+r.id);
  for(const o of r.openings){const length=["front","rear"].includes(o.wall)?r.wFt:r.dFt;
   if(o.offsetFt<0||o.widthFt<=0||o.offsetFt+o.widthFt>length+.001||o.sillFt<0||o.heightFt<=0||o.sillFt+o.heightFt>layout.wallHeightFt+.001)errors.push("Invalid opening: "+r.id);}
 }
 const rooms=layout.rooms;
 for(let i=0;i<rooms.length;i++)for(let j=i+1;j<rooms.length;j++){
  const a=rooms[i],b=rooms[j];if(a.floorIndex!==b.floorIndex)continue;
  const dx=Math.min(a.xFt+a.wFt,b.xFt+b.wFt)-Math.max(a.xFt,b.xFt);
  const dy=Math.min(a.yFt+a.dFt,b.yFt+b.dFt)-Math.max(a.yFt,b.yFt);
  if(dx>.02&&dy>.02)errors.push("Room overlap: "+a.id+"/"+b.id);
 }
 return errors;
}
/** Concept estimate uses room-facing painted surfaces, not construction BOQ. */
export function paintEstimate(d:StudioDesign,coats=2,coverageSqMPerL=10){
 if(!Number.isFinite(coats)||coats<=0||!Number.isFinite(coverageSqMPerL)||coverageSqMPerL<=0)throw new RangeError("Invalid paint inputs");
 let gross=0,net=0;for(const r of d.layout.rooms){if(r.kind==="open"||r.kind==="parking")continue;
  const a=2*(r.wFt+r.dFt)*d.layout.wallHeightFt;
  const holes=r.openings.reduce((s,o)=>s+o.widthFt*o.heightFt,0);gross+=a;net+=Math.max(0,a-holes);
 }return {grossSqM:gross*.09290304,netSqM:net*.09290304,litres:Math.ceil(net*.09290304*coats/coverageSqMPerL)};
}
/** Wall segments around openings: gaps are real geometry, not painted decals. */
export type WallPatch={roomId:string;floorIndex:number;side:Opening["wall"];startFt:number;endFt:number;bottomFt:number;topFt:number};
export function wallPatches(room:DesignRoom,heightFt=9.5):WallPatch[]{
 const patches:WallPatch[]=[];for(const side of ["front","rear","left","right"] as const){
  const length=side==="front"||side==="rear"?room.wFt:room.dFt;
  const openings=room.openings.filter(o=>o.wall===side);
  const xs=[0,length,...openings.flatMap(o=>[o.offsetFt,o.offsetFt+o.widthFt])].sort((a,b)=>a-b);
  const ys=[0,heightFt,...openings.flatMap(o=>[o.sillFt,o.sillFt+o.heightFt])].sort((a,b)=>a-b);
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
   const startFt=xs[i],endFt=xs[i+1],bottomFt=ys[j],topFt=ys[j+1];
   if(endFt-startFt<.001||topFt-bottomFt<.001)continue;
   const mx=(startFt+endFt)/2,my=(bottomFt+topFt)/2;
   if(openings.some(o=>mx>o.offsetFt-.001&&mx<o.offsetFt+o.widthFt+.001&&my>o.sillFt-.001&&my<o.sillFt+o.heightFt+.001))continue;
   patches.push({roomId:room.id,floorIndex:room.floorIndex,side,startFt,endFt,bottomFt,topFt});
  }
 }return patches;
}
