import type {Metadata} from "next";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {ProjectPlanner} from "@/components/project-planner";
import "./project.css";
export const metadata:Metadata={title:"My construction project planner",description:"Track your building checklist, budget and material requirements privately.",robots:{index:false,follow:false}};
export default function MyProject(){return <main className="catalog-page"><SiteHeader/><section className="page-hero page-hero-compact"><span className="eyebrow">YOUR BUILD · ONE STEP AT A TIME</span><h1>Build your dream.<br/><em>Stay in control.</em></h1><p>A free, private workspace to plan your next construction step, track your own budget and discover relevant materials.</p></section><ProjectPlanner/><SiteFooter/></main>}
