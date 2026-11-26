import {SaveMaterial} from "@/components/material-shortlist";
import {DealerComparison} from "@/components/dealer-comparison";
import {CatalogOffer} from "@/components/catalog-offer";
import {ProductPrice} from "@/components/product-price";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ProductGallery, ProductDetailTools } from "@/components/product-detail-tools";
import {BrandMark} from "@/components/brand-mark";
import { getCategory, getProduct, getProductsByCategory } from "@/modules/catalog/marketplace";
import {isPublicConstructionProduct} from "@/modules/catalog/discovery-policy";
import {rangeVariantLabel} from "@/modules/catalog/media-usage";

type Props = { params: Promise<{ category: string; slug: string }> };
export async function generateStaticParams() { const { demoProducts } = await import("@/modules/catalog/marketplace"); return demoProducts.map((item) => ({ category: item.category, slug: item.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { category, slug } = await params; const item = getProduct(category, slug); return item ? { title: item.name, description: item.description, ...(!isPublicConstructionProduct(item)?{robots:{index:false,follow:true}}:{}), alternates: { canonical: `/materials/${item.category}/${item.slug}` } } : { title: "Product not found" }; }

export default async function MaterialDetailPage({ params }: Props) {
  const { category, slug } = await params; const product = getProduct(category, slug); if (!product) notFound(); const parent = getCategory(category); if (!parent) notFound();
  const siblings=product.familyKey?getProductsByCategory(category).filter(item=>item.familyKey===product.familyKey&&item.slug!==product.slug):[];
  const quoteHref = `/quotes?category=${encodeURIComponent(category)}&material=${encodeURIComponent(product.name)}`;
  return <main className="catalog-page"><SiteHeader /><div className="product-detail-wrap"><nav className="detail-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/materials">Materials</Link><span>/</span><Link href={`/materials/${category}`}>{parent.title}</Link><span>/</span><span>{product.name}</span></nav><header className="detail-title"><small>{parent.title} / {product.brand}</small><h1>{product.name}</h1><ProductPrice category={product.category} slug={product.slug} quoteOnly={product.quoteOnly}/></header><section className="product-detail"><ProductGallery product={product} /><div className="product-detail-copy"><span className="eyebrow">{parent.title}</span><div className="product-brand-identity"><BrandMark name={product.brand}/><small>Independent brand reference, not official reseller</small></div><p>{product.description}</p>{siblings.length>0&&<section className="product-variant-panel"><h2>1. Choose size / variant</h2><div className="catalog-variant-links" aria-label="Select material size"><span className="selected-material-variant" aria-current="true">{rangeVariantLabel(product)} · Selected</span>{siblings.map(item=><Link key={item.slug} href={`/materials/${item.category}/${item.slug}`} prefetch={false} data-intent-prefetch="">{rangeVariantLabel(item)}</Link>)}</div><p>Confirm the exact size before requesting your order.</p></section>}<ProductDetailTools key={product.slug} product={product} quoteHref={quoteHref}/><SaveMaterial category={product.category} slug={product.slug} name={product.name}/>
<CatalogOffer category={product.category} slug={product.slug}/>
{product.manufacturerReference&&<a href={product.manufacturerReference} target="_blank" rel="noopener noreferrer">Manufacturer details ↗</a>}<div className="detail-specs"><h2>Product details</h2>{product.specifications.map((spec) => <div key={spec.label}><strong>{spec.label}</strong><span>{spec.value}</span></div>)}</div>{!product.quoteOnly&&category!=="aggregates"&&<DealerComparison category={category} slug={product.slug}/> }<p>Neerva can arrange supply directly even when no dealer is listed. Final delivered price requires your approval before preparation.</p><p className="professional-note">Confirm the manufacturer SKU, product markings, batch, actual image, applicable documents, taxes, freight, unloading and delivery time in writing. A request is not an accepted order.</p></div></section><section className="category-guidance"><h2>How your material request works</h2><ol><li>Choose your quantity and provide the delivery address.</li><li>Neerva arranges supply directly or through eligible dealers and confirms the delivered price.</li><li>Accept the final amount before fulfillment; track progress in My Orders.</li></ol><Link href={`/materials/${category}`} className="text-link">Explore more {parent.title} examples <span>→</span></Link></section></div><SiteFooter /></main>;
}

