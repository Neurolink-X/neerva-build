import type {Metadata} from "next";
import Image from "next/image";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {BrandDirectory} from "@/components/brand-directory";
import {catalogCategories} from "@/modules/catalog/catalog";
import {directoryCards,dealerPath} from "@/modules/catalog/brand-pages";
import "./brands.css";

const title="Construction material brands by category";
const description="Explore cement, steel, tiles, plumbing and finishing brands. Compare pack sizes and specifications, browse published dealer listings and prepare an itemized quote.";
export const metadata:Metadata={title,description,alternates:{canonical:"/brands"},openGraph:{title,description,url:"/brands",images:["/images/studio/shell.webp"]},twitter:{card:"summary_large_image",title,description,images:["/images/studio/shell.webp"]}};

export default function BrandsPage(){
  const sections=catalogCategories.map(c=>({...c,dealer:dealerPath(c.slug),cards:directoryCards(c.slug)}));
  return <main className="catalog-page"><SiteHeader/><div className="br-wrap">
    <header className="br-hero"><div><h1>Find the right brand for your build.</h1><p>Start with a material. Compare grades, pack sizes and finishes, then ask for a delivered price for your site.</p><a href="#brand-finder">Explore brands ↓</a></div><div className="br-cover"><Image priority src="/images/studio/shell.webp" alt="House under construction" fill sizes="(max-width:620px) 100vw, 48vw"/></div></header>
    <div id="brand-finder"><BrandDirectory sections={sections}/></div>
  </div><SiteFooter/></main>;
}
