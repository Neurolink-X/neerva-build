import {CatalogOffer} from "@/components/catalog-offer";
import {ProductPrice} from "@/components/product-price";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ProductGallery, ProductDetailTools } from "@/components/product-detail-tools";
import {BrandMark} from "@/components/brand-mark";
import { getCategory, getProduct, getProductsByCategory } from "@/modules/catalog/marketplace";
import {rangeVariantLabel} from "@/modules/catalog/media-usage";

type Props = { params: Promise<{ category: string; slug: string }> };
export async function generateStaticParams() { const { demoProducts } = await import("@/modules/catalog/marketplace"); return demoProducts.map((item) => ({ category: item.category, slug: item.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { category, slug } = await params; const item = getProduct(category, slug); return item ? { title: item.name, description: item.description, alternates: { canonical: `/materials/${item.category}/${item.slug}` } } : { title: "Product not found" }; }

export default async function MaterialDetailPage({ params }: Props) {
  const { category, slug } = await params; const product = getProduct(category, slug); if (!product) notFound(); const parent = getCategory(category); if (!parent) notFound();
  const siblings=product.familyKey?getProductsByCategory(category).filter(item=>item.familyKey===product.familyKey&&item.slug!==product.slug):[];
  const quoteHref = `/quotes?category=${encodeURIComponent(category)}&material=${encodeURIComponent(product.name)}`;
  return <main className="catalog-page"><SiteHeader /><div className="product-detail-wrap"><nav className="detail-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/materials">Materials</Link><span>/</span><Link href={`/materials/${category}`}>{parent.title}</Link><span>/</span><span>{product.name}</span></nav><header className="detail-title"><small>{parent.title} / {product.brand}</small><h1>{product.name}</h1><ProductPrice category={product.category} slug={product.slug} quoteOnly={product.quoteOnly}/> <Link href={quoteHref}>Get delivered price →</Link></header><section className="product-detail"><ProductGallery product={product} /><div className="product-detail-copy"><span className="eyebrow">{parent.title}</span><div className="product-brand-identity"><BrandMark name={product.brand}/><small>Independent brand reference, not official reseller</small></div><p>{product.description}</p><div className="quote-only-callout">
 <strong style={{display:"block"}}>Get a delivered quote</strong>
 <span>Share your quantity and pincode to confirm stock, freight and delivery.</span>
</div>
<CatalogOffer category={product.category} slug={product.slug}/>
{product.manufacturerReference&&<a href={product.manufacturerReference} target="_blank" rel="noopener noreferrer">Manufacturer details ↗</a>}<div className="detail-specs"><h2>Product details</h2>{product.specifications.map((spec) => <div key={spec.label}><strong>{spec.label}</strong><span>{spec.value}</span></div>)}</div>{siblings.length>0&&<section className="product-variant-panel"><h2>Other sizes in this material family</h2><p>Each size is a separate specification request; the image may depict only the general material.</p><div className="catalog-variant-links">{siblings.map(item=><Link key={item.slug} href={`/materials/${item.category}/${item.slug}`}>{rangeVariantLabel(item)}</Link>)}</div></section>}<ProductDetailTools product={product} /><Link className="button button-dark" href={"/checkout?"+new URLSearchParams({category:product.category,product:product.slug})}>Place order with Neerva →</Link><p>Neerva can arrange supply directly even when no dealer is listed. Final delivered price requires your approval before preparation.</p><Link className="button button-orange" href={quoteHref}>{product.quoteOnly ? "Request private quotation" : "Ask for current dealer quote"} →</Link><p className="professional-note">Confirm the manufacturer SKU, product markings, batch, actual image, applicable documents, taxes, freight, unloading and delivery time in writing. A request is not an accepted order.</p></div></section><section className="category-guidance"><h2>How a Neerva material request should work</h2><ol><li>Tell us your quantity, delivery pincode and needed date.</li><li>Eligible dealers respond with an itemized private offer.</li><li>Review the final amount and schedule before accepting.</li></ol><Link href={`/materials/${category}`} className="text-link">Explore more {parent.title} examples <span>→</span></Link></section></div><SiteFooter /></main>;
}

