import type {Room} from "./layout.ts";
export const walls=["rear","right","front","left"] as const;
export type Wall=(typeof walls)[number];
export type Opening={wall:Wall;offset:number;width:number;sill:number;height:number;kind:"door"|"window"};
export type Shade={id:string;name:string;hex:string;tier?:"Basic"|"Emulsion"|"Premium"|"Designer"};
export type Finish={wall:string;accent:string;ceiling:string;accentWall:Wall;floor:"tile"|"wood"|"marble"};
export type Exterior={main:string;band:string;boundary:string;gate:string;trim:string};
export const baseline:Shade[]=[
 {id:"warm-ivory",name:"Warm ivory",hex:"#efe6d6",tier:"Emulsion"},
 {id:"stone-white",name:"Stone white",hex:"#eceae2",tier:"Basic"},
 {id:"sage",name:"Muted sage",hex:"#b2c0ac",tier:"Premium"},
 {id:"terracotta",name:"Terracotta",hex:"#b46a51",tier:"Designer"},
 {id:"slate",name:"Urban slate",hex:"#697775",tier:"Premium"},
 {id:"charcoal",name:"Charcoal",hex:"#3e4746",tier:"Designer"},
];
export const initialExterior:Exterior={main:"warm-ivory",band:"sage",boundary:"stone-white",gate:"charcoal",trim:"stone-white"};
export const defaultFinish:Finish={wall:"warm-ivory",accent:"sage",ceiling:"stone-white",accentWall:"rear",floor:"tile"};
function opening(wall:Wall,offset:number,width:number,sill:number,height:number,kind:"door"|"window"):Opening{
 return {wall,offset:Math.floor(offset),width:Math.floor(width),sill:Math.floor(sill),height:Math.floor(height),kind};
}
export function roomModel(r:Room){
 const height=2800,lengths:Record<Wall,number>={rear:r.w,right:r.h,front:r.w,left:r.h};
 const openings:Opening[]=[];
 const doorSide:Wall=r.lane?"left":"right";
 if(lengths[doorSide]>=980)openings.push(opening(doorSide,Math.floor((lengths[doorSide]-850)/2),850,0,2100,"door"));
 const windowSide:Wall=r.lane?"right":"left";
 if(lengths[windowSide]>=750)openings.push(opening(windowSide,Math.floor((lengths[windowSide]-Math.min(900,lengths[windowSide]*.4))/2),Math.min(900,Math.floor(lengths[windowSide]*.4)),900,1100,"window"));
 if(r.streetWall&&r.w>=1100)openings.push(opening("front",Math.floor(r.w*.25),Math.min(1200,Math.floor(r.w*.45)),900,1100,"window"));
 const wallAreas=Object.fromEntries(walls.map(w=>[w,(lengths[w]*height-openings.filter(o=>o.wall===w).reduce((a,o)=>a+o.width*o.height,0))/1e6])) as Record<Wall,number>;
 const netWalls=Object.values(wallAreas).reduce((a,v)=>a+v,0);
 return{width:r.w,depth:r.h,height,lengths,openings,wallAreas,netWalls,ceiling:r.w*r.h/1e6};
}
export function paintAreas(r:Room,shades:readonly Shade[]=baseline):Record<string,number>{
 const model=roomModel(r);const result:Record<string,number>={};
 for(const wall of walls)result[wall]=model.wallAreas[wall];
 if(!["Courtyard","Balcony"].includes(r.name))result.ceiling=model.ceiling;
 void shades;
 return result;
}
export function areaLitres(room:Room,coats=2,coverageSqMPerLitre=10){
 if(!Number.isFinite(coats)||coats<1||coats>5||!Number.isFinite(coverageSqMPerLitre)||coverageSqMPerLitre<1||coverageSqMPerLitre>30)return 0;
 const net=Object.values(paintAreas(room)).reduce((a,b)=>a+b,0);
 return Math.ceil(net*coats/coverageSqMPerLitre*10)/10;
}
