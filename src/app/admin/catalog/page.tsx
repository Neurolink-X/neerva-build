import {CatalogMediaAudit} from "@/components/catalog-media-audit";
import {DealerProductRequests} from "@/components/dealer-product-requests";
import type { Metadata } from "next";
import Link from "next/link";
import { CatalogAdminPanel } from "@/components/catalog-admin-panel";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Platform catalog administration", description: "Protected product catalog controls for NEERVA BUILD administrators.", robots: { index: false, follow: false }, alternates: { canonical: "/admin/catalog" } };

export default function AdminCatalogPage() {
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/admin">Admin dashboard /</Link><span className="eyebrow">ADMIN · CATALOG</span><h1>Material catalog</h1><p>Create and review categories, brands, products and variants. Manage publication and archive records from one workspace.</p><nav className="admin-page-links"><Link href="/admin">Admin overview</Link><Link href="/admin/marketing">Marketing &amp; offers</Link><Link href="/admin/pricing">Pricing</Link></nav></section><section className="section catalog-admin-content"><DealerProductRequests role="admin"/><CatalogMediaAudit/><CatalogAdminPanel /></section><SiteFooter /></main>;
}
