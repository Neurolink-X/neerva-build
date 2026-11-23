import type { Metadata } from "next";
import Link from "next/link";
import { MaterialsBrowser } from "@/components/materials-browser";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { catalogCategories } from "@/modules/catalog/catalog";
import { loadCatalogProducts } from "@/modules/catalog/public-products";

export const metadata: Metadata = { title: "Construction Materials & Brands", description: "Browse construction material categories, example specifications and brand options. Request dealer pricing after availability is confirmed.", alternates: { canonical: "/materials" } };
export const dynamic = "force-dynamic";

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search = "" } = await searchParams;
  const products = await loadCatalogProducts();
  return <main className="catalog-page"><SiteHeader /><section className="page-hero"><span className="eyebrow">MATERIALS CATALOG</span><h1>Find the right material.<br /><em>Compare the details.</em></h1><p>Browse technical profiles by material, brand, grade and size. Add what your site needs to a material list, then prepare one request for dealer availability and a complete delivered quote.</p><div className="catalog-hero-actions"><Link className="button button-orange" href="/quotes">Request a private quote â†’</Link><span>Prices, stock and delivery are confirmed by each dealer.</span></div></section><section className="section ca¶»§q«^