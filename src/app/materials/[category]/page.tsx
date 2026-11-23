import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { MaterialsBrowser } from "@/components/materials-browser";
import { catalogCategories } from "@/modules/catalog/catalog";
import { getCategory } from "@/modules/catalog/marketplace";
import { loadCatalogProducts } from "@/modules/catalog/public-products";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };
export function generateStaticParams() { return catalogCategories.map(({ slug }) => ({ category: slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { category } = await params; const item = getCategory(category); return item ? { title: `${item.title} | Materials`, description: `${item.description}. Browse example specifications and ask dealers for current availability and a private quote.`, alternates: { canonical: `/materials/${item.slug}` } } : { title: "Category not found" }; }

export default async function MaterialCategoryPage({ params }: Props) {
  const { category } = await params; const item = getCategory(category); if (!item) notFound();
  const products = (await loadCatalogProducts()).filter((product) => product.category === item.slug);
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/materials">M¶»§q«^