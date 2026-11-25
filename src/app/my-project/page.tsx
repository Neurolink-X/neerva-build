import type {Metadata} from "next";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {ProjectPurchaseTools} from "@/components/project-purchase-tools";
import "../build-iq/academy.css";
import {ProjectPlanner} from "@/components/project-planner";
import "./project.css";
export const metadata:Metadata={title:"My construction project planner",description:"Track your building checklist, budget and material requirements privately.",robots:{index:false,follow:false}};
export default function MyProject(){return <main className="catalog-page"><SiteHeader/><section className="page-hero page-hero-compact"><span className="eyebrow">YOUR BUILD · ONE STEP AT A TIME</span><h1>Build your dream.<br/><em>Stay in control.</em></h1><p>A free, private workspace to plan your next construction step, track your own budget and discover relevant materials.</p></section><ProjectPlanner/><section className="academy project-purchase-section"><details id="purchase-tools"><summary>Optional: compare material prices & deliveries</summary><p>Already have written prices or a material delivery to check? Use these private calculators. They do not contact suppliers or create orders.</p><ProjectPurchaseTools/></details></section><SiteFooter/></main>}
