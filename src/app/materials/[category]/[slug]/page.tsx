import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ProductDetailTools, ProductGallery } from "@/components/product-detail-tools";
import { ProductArtwork } from "@/components/product-artwork";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getCategory } from "@/modules/catalog/marketplace";
import { findCatalogProduct, loadCatalogProducts } from "@/modules/catalog/public-products";

type Props = { params: Promise<{ category: string; slug: string }> };
export const dynamic = "force-dynamic";
export async function generateStaticParams() { const { demoProducts } = await import("@/modules/catalog/marketplace"); return demoProducts.map((item) => ({ category: item.category, slug: item.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { category, slug } = await params; const item = await findCatalogProduct(category, slug); return item ? { title: item.name, description: `${item.name} â€” technical profile and dealer quote options. Ask dealers to confirm exact specifications, current stock and delivered price.`, alternates: { canonical: `/materials/${item.category}/${item.slug}` }, robots: item.publishedListing ? undefined : { index: false, follow: true } } : { title: "Product not found", robots: { index: false, follow: false } }; }

export default async function MaterialDetailPage({ params ¶»§q«^