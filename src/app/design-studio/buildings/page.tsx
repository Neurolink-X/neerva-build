import type {Metadata} from "next";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {BuildingPurposeStudioLoader} from "@/components/building-purpose-studio-loader";
import "./buildings.css";
export const metadata:Metadata={title:"Building Studio | Commercial, School & Rental Planning | Neerva Build",description:"Compare purpose-specific building zoning concepts for retail, schools, restaurants and rental properties. Professional review required."};
export const dynamic="force-dynamic";
export default function BuildingsPage(){return <main className="catalog-page"><SiteHeader/><BuildingPurposeStudioLoader cloudEnabled={process.env.COMMERCIAL_PROJECT_STORAGE_ENABLED==="true"}/><SiteFooter/></main>}
