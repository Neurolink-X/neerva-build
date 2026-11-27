import {commercialElements} from "./commercial-elements.ts";
import {validateBuildingConcept,type BuildingConcept} from "./building-purpose.ts";
import {commercialGeometryIssues} from "./commercial-detail.ts";
const FT2_TO_M2=.09290304,FT3_TO_M3=.028316846592;
export function commercialMaterialBasis(plan:BuildingConcept){
 if(validateBuildingConcept(plan).length||commercialGeometryIssues(plan).length)return null;
 const {walls,slabs}=commercialElements(plan);
 const floors=Array.from({length:plan.brief.floors},(_,floor)=>{
  const w=walls.filter(e=>e.floor===floor),s=slabs.filter(e=>e.floor===floor);
  const faceSqFt=w.reduce((sum,e)=>sum+(e.end-e.start)*(e.top-e.bottom),0);
  const grossWallFt3=w.reduce((sum,e)=>sum+(e.end-e.start)*(e.top-e.bottom)*e.thickness,0);
  const floorSqFt=s.filter(e=>e.id.endsWith("-floor")).reduce((sum,e)=>sum+e.w*e.d,0);
  const roofSqFt=s.filter(e=>e.id.endsWith("-roof")).reduce((sum,e)=>sum+e.w*e.d,0);
  const grossSlabFt3=s.reduce((sum,e)=>sum+e.w*e.d*(e.top-e.bottom),0);
  return {floor,faceSqFt,floorSqFt,roofSqFt,grossWallM3:grossWallFt3*FT3_TO_M3,grossSlabM3:grossSlabFt3*FT3_TO_M3};
 });
 return {floors,conceptOnly:true as const};
}
export type FinishInputs={floorSqFt:number;faceSqFt:number;paintFaces:1|2;coverageM2PerL:number;coats:number;paintWastePercent:number;tileCoverageSqFtPerBox:number;tileWastePercent:number};
export function commercialFinishQuantities(i:FinishInputs){
 if(!Object.values(i).every(Number.isFinite)||i.floorSqFt<0||i.faceSqFt<0||![1,2].includes(i.paintFaces)||i.coverageM2PerL<=0||i.coverageM2PerL>100||!Number.isInteger(i.coats)||i.coats<1||i.coats>5||i.paintWastePercent<0||i.paintWastePercent>50||i.tileCoverageSqFtPerBox<=0||i.tileCoverageSqFtPerBox>1000||i.tileWastePercent<0||i.tileWastePercent>50)return null;
 return {paintLitres:Math.ceil(i.faceSqFt*i.paintFaces*FT2_TO_M2*i.coats/i.coverageM2PerL*(1+i.paintWastePercent/100)),tileBoxes:Math.ceil(i.floorSqFt/i.tileCoverageSqFtPerBox*(1+i.tileWastePercent/100))};
}
