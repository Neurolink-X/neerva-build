import type { Metadata } from "next";
import Link from "next/link";
import { CatalogAdminPanel } from "@/components/catalog-admin-panel";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Platform catalog administration", description: "Protected product catalog controls for NEERVA BUILD administrators.", robots: { index: false, follow: false }, alternates: { canonical: "/admin/catalog" } };

export default function AdminCatalogPage() {
  return <main className="catalog-page"><SiteHeader /><a href="/admin/studio">Studio rules and paint shades</a><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/admin">Admin dashboard /</Link><span className="eyebrow">ADMIN · CATALOG</span><h1>Manage the material catalog.</h1><p>Add products and technical specs, keep new listings in draft, then control publication. All catalog actions require a platform admin role verified by Supabase.</p><nav className="admin-page-links"><Link href="/admin">Admin overview</Link><Link href="/admin/marketing">Marketing &amp; offers</Link><Link href="/admin/pricing">Pricing</Link></nav></section><section className="section catalog-admin-content"><CatalogAdminPanel /></section><SiteFooter /></main>;
}
