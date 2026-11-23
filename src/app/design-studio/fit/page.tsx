import type {Metadata} from "next";
import {StudioPlotFitFinder} from "@/components/studio-plot-fit-finder";
import "./fit.css";
export const metadata:Metadata={title:"Find a Home Design That Fits Your Plot",description:"Compare 24 original home concepts against your plot dimensions, bedrooms and parking requirements. All matches require local architect approval.",alternates:{canonical:"/design-studio/fit"},robots:{index:false,follow:true}};
export default function FitPage(){return <StudioPlotFitFinder/>}
