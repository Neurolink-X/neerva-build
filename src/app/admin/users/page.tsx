import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { UserAccessPanel } from "@/components/user-access-panel";

export const metadata: Metadata = { title: "User access management", description: "Audited role-based access management for NEERVA BUILD platform administrators.", robots: { index: false, follow: false }, alternates: { canonical: "/admin/users" } };

export default function AdminUsersPage() {
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/account">Account /</Link><span className="eyebrow">ADMIN · IDENTITY</span><h1>Manage platform access.</h1><p>Look up an account by UUID and review its roles. Role grants are audited; only a super administrator can make changes.</p><nav className="admin-page-links"><Link href="/admin/catalog">Catalog</Link><Link href="/admin/system-health">System health</Link><Link href="/dealer/inventory">Dealer inventory</Link></nav></section><section className="section ops-content"><UserAccessPanel /></section><SiteFooter /></main>;
}
