import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {AccountPrivateFeed} from "@/components/account-private-feed";
import "../account-hub.css";
import "@/app/design-studio/studio.css";
import "@/app/design-studio/road-planner/road-planner.css";
export const metadata:Metadata={title:"Saved house designs",robots:{index:false,follow:false}};
export default function AccountPage(){return <main className="catalog-page"><SiteHeader/><section className="section naccount-page"><Link href="/account">← My account</Link><h1>Saved house designs</h1><p>Open the original private concept saved to your account, on any signed-in device. 2D and 3D use the same stored geometry.</p><AccountPrivateFeed mode="designs"/></section><SiteFooter/></main>}
