import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {InstallAppAction} from "@/components/install-app-action";
import "./install.css";

export const metadata:Metadata={
 title:"Neerva app | Quick access",
 description:"Keep home planning, construction materials and quotations within easy reach.",
 robots:{index:false,follow:true}
};
export default function InstallPage(){
 return <div className="install-page">
  <SiteHeader/>
  <main className="install-help-page">
   <Link href="/" className="install-back">← Home</Link>
   <p className="install-eyebrow">NEERVA BUILD · QUICK ACCESS</p>
   <h1>Your home project, one tap away.</h1>
   <p>Explore construction materials, plan your home and manage your project from a single shortcut.</p>
   <InstallAppAction/>
   <section className="install-benefits" aria-label="What you can do">
    <article>
     <h2>Explore materials</h2>
     <p>Compare brands, grades and product specifications.</p>
     <Link href="/materials">Browse materials →</Link>
    </article>
    <article>
     <h2>Plan your home</h2>
     <p>Explore floor plans and try exterior colours.</p>
     <Link href="/design-studio">Open Design Studio →</Link>
     <Link href="/design-studio/road-planner">Explore house plans →</Link>
    </article>
    <article>
     <h2>Manage your project</h2>
     <p>Prepare quotations and check your orders.</p>
     <Link href="/my-project">My Project →</Link>
    </article>
   </section>
   <p className="install-note">Installation is free and uses your browser, not a Play Store or App Store download. Some browsers only support a home-screen shortcut. An offline information screen is available when the connection drops; login, live quotes, prices, stock, orders and payments require internet.</p>
  </main>
  <SiteFooter/>
 </div>;
}
