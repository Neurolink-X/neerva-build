import type {Metadata} from "next";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {BuildingPurposeStudio} from "@/components/building-purpose-studio";
import "./buildings.css";
export const metadata:Metadata={title:"Building Studio | Commercial, School & Rental Planning | Neerva Build",description:"Compare purpose-specific building zoning concepts for retail, schools, restaurants and rental properties. Professional review required."};
export default function BuildingsPage(){return <main className="catalog-page"><SiteHeader/><BuildingPurposeStudio/><SiteFooter/></main>}
