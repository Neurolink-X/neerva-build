import type { Metadata } from "next";
import Link from "next/link";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { catalogCategories } from "@/modules/catalog/catalog";

export const metadata: Metadata = { title: "Request a Construction Material Quote", description: "Prepare a private construction material enquiry with quantity, delivery city and pincode. Dealer offers and current prices are not active until backend setup is complete.", robots: { index: false, follow: false }, alternates: { canonical: "/quotes" } };
type Props = { searchParams: Promise<{ category?: string; material?: string; cart?: string }> };

export default async function QuotePage({ searchParams }: Props) {
  const query = await searchParams;
  const category = catalogCategories.some((item) => item.slug === query.category) ? query.category! : "aggregates";
  const includeBasket = query.cart === "1";
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href={includeBasket ? "/basket" : "/materials"}>{includeBasket ? "Your material list /" : "Materials catalog /"}</Link><span className="eyebrow">BULK & DEALER QUOTES</span><h1>Get the full amount<br /><em>before you accept.</em></h1><p>{includeBasket ? "Send your selected materials together. Dealers should confirm stock, item prices, tax, freight, unloading and delivery terms befo¶»§q«^