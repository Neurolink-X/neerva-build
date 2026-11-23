import type {Metadata} from "next";
import {RoadPlanWorkbench} from "@/components/road-plan-workbench";
import "../studio.css";
import "./road-planner.css";
export const metadata:Metadata={title:"Road-correct 18×50 Home Plan — NEERVA BUILD",description:"Tested concept-only road-facing plot plan for 100 gaj, G and G+1. Check doors, parking, stairs and preliminary paint area. Requires architect/engineer and approval.",robots:{index:false,follow:false}};
export default function Page(){return <RoadPlanWorkbench/>}
