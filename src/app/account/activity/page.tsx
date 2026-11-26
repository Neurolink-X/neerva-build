import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {AccountPrivateFeed} from "@/components/account-private-feed";
import "../account-hub.css";

export const metadata:Metadata={title:"Order & quote updates",robots:{index:false,follow:false}};
export default function AccountPage(){return <main className="catalog-page"><SiteHeader/><section className="section naccount-page"><Link href="/account">← My account</Link><h1>Order & quote updates</h1><p>Review recent status changes and dealer offers. This is your in-account activity feed, not a push notification service.</p><AccountPrivateFeed mode="activity"/></section><SiteFooter/></main>}
