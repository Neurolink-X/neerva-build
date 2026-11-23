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
  return <main className="catalog-page"><SiteHeader /><div className="product-detail-wrap"><nav className="detail-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/materials">Materials</Link><span>/</span><Link href={`/materials/${category}`}>{parent.title}</Link><span>/</span><span>{product.name}</span></nav><section className="product-detail"><ProductGallery product={product} /><div className="product-detail-copy"><span className="eyebrow">{parent.title} · {product.brand}</span><h1>{product.name}</h1><p>{product.description}</p><div className="quote-only-callout"><strong>{product.quoteOnly ? "Private dealer quotation" : "Request current dealer availability"}</strong><span>{product.quoteOnly ? "No public fixed selling price is shown for this bulk category." : "This preview does not have connected inventory or current dealer pricing."}</span></div><div className="detail-specs"><h2>Product details</h2>{product.specifications.map((spec) => <div key={spec.label}><strong>{spec.label}</strong><span>{spec.value}</span></div>)}</div><ProductDetailTools product={product} /><Link className="button button-orange" href={quoteHref}>{product.quoteOnly ? "Request private quotation" : "Ask for current dealer quote"} →</Link><p className="professional-note">Confirm specifications, applicable documents, taxes, freight, unloading and availability in writing before accepting a quote.</p></div></section><section className="category-guidance"><h2>How a Neerva material request should work</h2><ol><li>Tell us your quantity, delivery pincode and needed date.</li><li>Eligible dealers respond with an itemized private offer.</li><li>Review the final amount and schedule before accepting.</li></ol><Link href={`/materials/${category}`} className="text-link">Explore more {parent.title} examples <span>→</span></Link></section></div><SiteFooter /></main>;
}
