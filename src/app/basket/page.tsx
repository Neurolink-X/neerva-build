import type { Metadata } from "next";
import { CartReview } from "@/components/material-basket";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Your Material List", description: "Review construction materials and prepare a private dealer quote request.", robots: { index: false, follow: false }, alternates: { canonical: "/basket" } };

export default function BasketPage() {
  return <main className="catalog-page"><SiteHeader /><section className="basket-page"><CartReview /></section><SiteFooter /></main>;
}
