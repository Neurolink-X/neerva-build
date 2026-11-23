import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ProductGallery, ProductDetailTools } from "@/components/product-detail-tools";
import { getCategory, getProduct } from "@/modules/catalog/marketplace";

type Props = { params: Promise<{ category: string; slug: string }> };
export async function generateStaticParams() { const { demoProducts } = await import("@/modules/catalog/marketplace"); return demoProducts.map((item) => ({ category: item.category, slug: item.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { category, slug } = await params; const item = getProduct(category, slug); return item ? { title: item.name, description: item.description, alternates: { canonical: `/materials/${item.category}/${item.slug}` } } : { title: "Product not found" }; }

export default async function MaterialDetailPage({ params }: Props) {
  const { category, slug } = await params; const product = getProduct(category, slug); if (!product) notFound(); const parent = getCategory(category); if (!parent) notFound();
  const quoteHref = `/quotes?category=${encodeURIComponent(category)}&material=${encodeURIComponent(product.name)}`;
  return <main className="catalog-page"><SiteHeader /><div className="product-detail-wrap"><nav className="detail-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/materials">Materials</Link><span>/</span><Link href={`/materials/${category}`}>{parent.title}</Link><span>/</span><span>{product.name}</span></nav><section className="product-detail"><ProductGallery product={product} /><div className="product-detail-copy"><span className="eyebrow">{parent.title} · {product.brand}</span><h1>{product.name}</h1><p>{product.description}</p><div className="quote-only-callout">
 <strong>{product.quoteOnly?"Bulk quotation required":"Supplier verification pending"}</strong>
 <span>Reference brand/range only · Manufacturer SKU not confirmed · No live stock or price · Nationwide supply requires explicit admin/supplier confirmation.</span>
</div>
<div className="catalog-product-proof" aria-label="Product authenticity status">
 <span>Brand shown for discovery, not authorized dealer proof</span><span>Exact SKU: {product.manufacturerSku??"Awaiting verification"}</span>
 <span>Product packaging photo: {product.imageVerified?"Review recorded":"Category photo only"}</span>
 {product.manufacturerReference&&<a href={product.manufacturerReference} target="_blank" rel="noopener noreferrer">Check product family on manufacturer website ↗</a>}
</div><div className="detail-specs"><h2>Product details</h2>{product.specifications.map((spec) => <div key={spec.label}><strong>{spec.label}</strong><span>{spec.value}</span></div>)}</div><ProductDetailTools product={product} /><Link className="button button-orange" href={quoteHref}>{product.quoteOnly ? "Request private quotation" : "Ask for current dealer quote"} →</Link><p className="professional-note">Confirm the manufacturer SKU, product markings, batch, actual image, applicable documents, taxes, freight, unloading and delivery time in writing. A request is not an accepted order.</p></div></section><section className="category-guidance"><h2>How a Neerva material request should work</h2><ol><li>Tell us your quantity, delivery pincode and needed date.</li><li>Eligible dealers respond with an itemized private offer.</li><li>Review the final amount and schedule before accepting.</li></ol><Link href={`/materials/${category}`} className="text-link">Explore more {parent.title} examples <span>→</span></Link></section></div><SiteFooter /></main>;
}
