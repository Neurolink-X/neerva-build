import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {SavedAddressBook} from "@/components/saved-address-book";
import "../account-hub.css";
export const metadata:Metadata={title:"My delivery addresses",robots:{index:false,follow:false}};
export default function AddressesPage(){return <main className="catalog-page"><SiteHeader/><section className="section naccount-page"><Link href="/account">← My account</Link><h1>My addresses</h1><p>Manage construction sites and delivery locations. Saved addresses never submit an order or change a previous order.</p><SavedAddressBook/></section><SiteFooter/></main>}
