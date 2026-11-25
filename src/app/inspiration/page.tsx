import type {Metadata} from "next";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {InspirationStudio} from "@/components/inspiration-studio";
import "./inspiration.css";
export const metadata:Metadata={title:"Dream Home Inspiration & Mood Boards",description:"Explore home exteriors, interiors, material finishes and colour combinations. Create and share a private inspiration board.",alternates:{canonical:"/inspiration"}};
export default function InspirationPage(){return <main className="catalog-page"><SiteHeader/><InspirationStudio/><SiteFooter/></main>}
