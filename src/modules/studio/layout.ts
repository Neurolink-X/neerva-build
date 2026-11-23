/** Concept-only, deterministic floor plans in integer millimetres. Never construction drawings. */
export type Side="N"|"E"|"S"|"W";
export type Brief={width:number;depth:number;road:Side;facing:Side;floors:number;beds:number;parking:boolean;variant?:number};
export type Rules={front:number;rear:number;side:number;bags:number;steel:number};
export const conceptRules:Rules={front:1000,rear:500,side:500,bags:4.4,steel:40};
export const specs={
  Living:[9500000,2400],Bedroom:[9500000,2400],Kitchen:[5000000,1800],
  "Bath/WC":[2800000,1200],Utility:[1500000,1000],Puja:[1400000,1000],
  Courtyard:[7500000,2500],Balcony:[2400000,1200],Stairs:[6800000,2000],
} as const;
export type Kind=keyof typeof specs;
export type Room={name:Kind;x:number;y:number;w:number;h:number;lane:number;streetWall?:boolean};
export type Plate={rooms:Room[];hallX:number;hallY:number;hallH:number};
export type GeneratedPlan={brief:Brief;rules:Rules;width:number;depth:number;plates:Plate[];carpetAreaSqM:number;builtAreaSqM:number;notice:string};
const validSide=(s:string):s is Side=>["N","E","S","W"].includes(s);
const bounded=(n:number)=>Math.max(0,Math.floor(n));
function room(name:Kind,x:number,y:number,w:number,h:number,lane:number,streetWall=false):Room{
 return{name,x:bounded(x),y:bounded(y),w:bounded(w),h:bounded(h),lane,streetWall};
}
export function generate(brief:Brief,rules:Rules=conceptRules):GeneratedPlan|null{
 if(![brief.width,brief.depth,brief.beds,brief.floors].every(Number.isSafeInteger)||
    !validSide(brief.road)||!validSide(brief.facing)||
    brief.beds<1||brief.beds>6||brief.floors<1||brief.floors>3||
    brief.width<4500||brief.depth<8000||Math.max(brief.width,brief.depth)>60000||
    ![rules.front,rules.rear,rules.side,rules.bags,rules.steel].every(Number.isFinite)||
    Math.min(rules.front,rules.rear,rules.side)<0||
    rules.front>10000||rules.rear>10000||rules.side>10000)return null;
 const rotate=brief.road==="E"||brief.road==="W";
 const width=rotate?brief.depth:brief.width,depth=rotate?brief.width:brief.depth;
 const x0=Math.floor(rules.side),y0=Math.floor(rules.rear);
 const W=width-2*x0,H=depth-y0-rules.front;
 if(W<3500||H<5500)return null;
 const bedroomsPerFloor=Math.ceil(brief.beds/brief.floors);
 const plates:Plate[]=[];
 for(let f=0;f<brief.floors;f++){
   const rooms:Room[]=[];
   const xLeft=x0,leftW=Math.floor(W*.58),rightW=W-leftW,topH=Math.floor(H*.32),midH=Math.floor(H*.37),botH=H-topH-midH;
   rooms.push(room("Living",xLeft,y0,leftW,topH,0,f===0));
   rooms.push(room("Kitchen",xLeft+leftW,y0,rightW,topH,1,f===0));
   const bedrooms=Math.min(bedroomsPerFloor,brief.beds-f*bedroomsPerFloor);
   if(bedrooms>=2){
      rooms.push(room("Bedroom",xLeft,y0+topH,Math.floor(W/2),midH,0));
      rooms.push(room("Bedroom",xLeft+Math.floor(W/2),y0+topH,W-Math.floor(W/2),midH,1));
   }else if(bedrooms===1){
      rooms.push(room("Bedroom",xLeft,y0+topH,W,midH,0));
   }else {
      rooms.push(room("Living",xLeft,y0+topH,W,midH,0));
   }
   const bathW=Math.max(1000,Math.floor(W*.3));
   const stairsW=Math.max(1000,Math.floor(W*.3));
   rooms.push(room("Bath/WC",xLeft,y0+topH+midH,bathW,botH,0));
   rooms.push(room("Stairs",xLeft+bathW,y0+topH+midH,stairsW,botH,1));
   const rest=W-bathW-stairsW;
   if(rest>=900)rooms.push(room(f?"Balcony":brief.variant===1?"Courtyard":"Utility",xLeft+bathW+stairsW,y0+topH+midH,rest,botH,1));
   plates.push({rooms,hallX:xLeft,hallY:y0+topH,hallH:Math.max(0,Math.floor(midH*.12))});
 }
 const carpetAreaSqM=plates.reduce((total,p)=>total+p.rooms.filter(r=>!["Balcony","Courtyard","Stairs"].includes(r.name)).reduce((a,r)=>a+r.w*r.h/1e6,0),0);
 return {brief,rules,width,depth,plates,carpetAreaSqM:Math.round(carpetAreaSqM*100)/100,builtAreaSqM:Math.round(W*H*brief.floors/1e4)/100,notice:"Concept only. Verify structure, setbacks, ventilation, stairs, orientation and local approval with a licensed architect or engineer."};
}
