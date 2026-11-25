import type {Metadata} from "next";
import Link from "next/link";
import {parseSiteShape,shapeErrors} from "@/modules/studio/site-shape";
import {RoadPlanClient} from "@/components/road-plan-client";
import type {PlanBrief,RoadSide} from "@/modules/studio/plan-model";
import "../studio.css";
import "../road-planner/road-planner.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"24 Plot-Specific Room Plans, Parking & Real 3D | NEERVA BUILD",
 description:"Generate up to 24 geometry-validated room arrangements for one measured rectangular or supported L-shaped plot, keeping car parking and road direction consistent in 2D and 3D. Draft concepts only.",
 robots:{index:false,follow:true}
};
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
const safe=(x:string|string[]|undefined,min:number,max:number,fallback:number)=>{
 const value=typeof x==="string"?Number(x):NaN;
 return Number.isFinite(value)&&value>=min&&value<=max?value:fallback;
};
export default async function PlotPortfolioPage({searchParams}:Props){
 const params=await searchParams;
 const invalidNumber=(value:string|string[]|undefined,min:number,max:number,integer=false)=>value!==undefined&&(typeof value!=="string"||!value.trim()||!Number.isFinite(Number(value))||Number(value)<min||Number(value)>max||(integer&&!Number.isInteger(Number(value))));
 const invalidBrief=invalidNumber(params.width,10,200)||invalidNumber(params.depth,15,250)||invalidNumber(params.floors,1,3,true)||invalidNumber(params.bedrooms,1,3,true)||(params.road!==undefined&&(typeof params.road!=="string"||!["N","E","S","W"].includes(params.road)))||(params.parking!==undefined&&params.parking!=="true"&&params.parking!=="false");
 const roadSide=(typeof params.road==="string"&&["N","E","S","W"].includes(params.road)?params.road:"N") as RoadSide;
 const floors=Math.trunc(safe(params.floors,1,3,2)) as 1|2|3;
 const bedrooms=Math.trunc(safe(params.bedrooms,1,3,3));
 const parking=params.parking!=="false";
 const siteShape=parseSiteShape(params.shape,params.notchWidth,params.notchDepth);
 const widthFt=safe(params.width,10,200,18),depthFt=safe(params.depth,15,250,50);
 if(invalidBrief||!siteShape||shapeErrors(widthFt,depthFt,siteShape).length)return <main className="nroad"><div className="nroad-hero"><h1>Check your plot outline</h1><p>Invalid or unsupported plot shape. Enter the actual site dimensions and missing corner; no substitute rectangular plan has been generated.</p><Link href="/design-studio">Return to plot inputs →</Link></div></main>;
 const initialBrief:PlanBrief={
  widthFt,depthFt,siteShape,
  roadSide,floors,bedrooms,parking,
  setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}
 };
 const initialOption=Math.trunc(safe(params.option,0,23,0));
 return <RoadPlanClient initialBrief={initialBrief} initialOption={initialOption}/>;
}

