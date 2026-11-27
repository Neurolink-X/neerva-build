import {validateBuildingConcept,type BuildingConcept} from "./building-purpose.ts";
const EPS=1e-6;
export type GridInput={spanXFt:number;spanYFt:number};
/** Reference grid only; spacing is supplied by the user, not a safe structural
 * span. No member sizes, load paths, support capacity or foundation inference. */
export function conceptReferenceGrid(plan:BuildingConcept,input:GridInput){
 if(validateBuildingConcept(plan).length||![input.spanXFt,input.spanYFt].every(n=>Number.isFinite(n)&&n>=2&&n<=100))return null;
 const covered=plan.zones.filter(z=>z.kind!=="open"&&z.kind!=="parking");
 const left=Math.min(...covered.map(z=>z.x)),right=Math.max(...covered.map(z=>z.x+z.w)),front=Math.min(...covered.map(z=>z.y)),rear=Math.max(...covered.map(z=>z.y+z.d));
 const nx=Math.ceil((right-left)/input.spanXFt),ny=Math.ceil((rear-front)/input.spanYFt);
 if((nx+1)*(ny+1)>12000)return null;
 const xs=Array.from({length:nx+1},(_,i)=>left+(right-left)*i/nx),ys=Array.from({length:ny+1},(_,i)=>front+(rear-front)*i/ny);
 const byFloor=Array.from({length:plan.brief.floors},(_,f)=>covered.filter(z=>z.floor===f));
 const nodes=xs.flatMap((x,i)=>ys.flatMap((y,j)=>{
  const levels=byFloor.flatMap((zones,f)=>zones.some(z=>x>=z.x-EPS&&x<=z.x+z.w+EPS&&y>=z.y-EPS&&y<=z.y+z.d+EPS)?[f]:[]);
  return levels.length?[{id:i+":"+j,x,y,levels,aligned:levels.length===plan.brief.floors}]:[];
 }));
 return {xs,ys,nodes,bounds:{left,right,front,rear},actualXFt:(right-left)/nx,actualYFt:(rear-front)/ny,approval:"REFERENCE_ONLY" as const};
}
