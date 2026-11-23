import type {Metadata} from "next";
import {RoadPlanWorkbench} from "@/components/road-plan-workbench";
import type {PlanBrief,RoadSide} from "@/modules/studio/plan-model";
import "../studio.css";
import "../road-planner/road-planner.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"24 Plot-Specific Room Plans, Parking & Real 3D | NEERVA BUILD",
 description:"Generate up to 24 geometry-validated room arrangements for one rectangular plot, keeping car parking and road direction consistent in 2D and 3D. Draft concepts only.",
 robots:{index:false,follow:true}
};
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
const safe=(x:string|string[]|undefined,min:number,max:number,fallback:number)=>{
 const value=typeof x==="string"?Number(x):NaN;
 return Number.isFinite(value)&&value>=min&&value<=max?Math.round(value*2)/2:fallback;
};
export default async function PlotPortfolioPage({searchParams}:Props){
 const params=await searchParams;
 const roadSide=(typeof params.road==="string"&&["N","E","S","W"].includes(params.road)?params.road:"N") as RoadSide;
 const floors=safe(params.floors,1,2,2) as 1|2;
 const bedrooms=safe(params.bedrooms,1,3,3);
 const parking=params.parking!=="false";
 const initialBrief:PlanBrief={
  widthFt:safe(params.width,10,200,18),depthFt:safe(params.depth,15,250,50),
  roadSide,floors,bedrooms,parking,
  setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}
 };
 return <RoadPlanWorkbench initialBrief={initialBrief}/>;
}
