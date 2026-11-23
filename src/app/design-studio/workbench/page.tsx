import type {Metadata} from "next";
import {PlanWorkbench} from "@/components/plan-workbench";
import "../studio.css";
export const metadata:Metadata={title:"Plot-based Home Concept Workbench",description:"Create original concept plans for your plot and experiment with room paint. Professional verification required.",robots:{index:false,follow:false}};
export default function Page(){return <main><PlanWorkbench/></main>}
