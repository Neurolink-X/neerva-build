import {canonicalPublicOrigin} from "@/modules/seo/site-origin";
import type { MetadataRoute } from "next";
import {publicIndexingEnabled} from "@/modules/seo/indexing";
import { articles } from "@/modules/blog/articles";
import { catalogCategories } from "@/modules/catalog/catalog";
import {brandPath,directoryCards} from "@/modules/catalog/brand-pages";
import {isPublicConstructionProduct} from "@/modules/catalog/discovery-policy";
import { demoProducts } from "@/modules/catalog/marketplace";
import {chapters} from "@/modules/home/handbook";
import {lessons} from "@/modules/home/academy";
import { studioDesigns } from "@/modules/studio/library";

export default function sitemap(): MetadataRoute.Sitemap {
  if(!publicIndexingEnabled(process.env))return [];
  const siteUrl = canonicalPublicOrigin(process.env);
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/family-homes`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/design-studio`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/studio-pricing`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/learn`, changeFrequency: "monthly", priority: 0.7 },
    {url:`${siteUrl}/build-iq`,changeFrequency:"monthly",priority:0.7},
    ...chapters.map(c=>({url:`${siteUrl}/build-iq/handbook/${c.id}`,lastModified:new Date(c.updated+"T00:00:00Z"),changeFrequency:"monthly" as const,priority:0.65})),
    ...lessons.map(l=>({url:`${siteUrl}/build-iq/${l.id}`,changeFrequency:"monthly" as const,priority:0.55})),
    { url: `${siteUrl}/learn/plot-size-in-gaj`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/learn/2d-to-3d-house-layout`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/learn/wall-paint-pattern-ideas`, changeFrequency: "monthly", priority: 0.65 },
    { url: `${siteUrl}/materials`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/brands`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/calculators`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/design-studio/library`, changeFrequency: "monthly", priority: 0.6 },
    ...catalogCategories.flatMap(c=>directoryCards(c.slug).filter(b=>b.count>0).map(b=>({url:siteUrl+brandPath(c.slug,b.name),changeFrequency:"weekly" as const,priority:0.6}))),
    ...studioDesigns.map((design) => ({ url: `${siteUrl}/design-studio/library/${design.slug}`, changeFrequency: "monthly" as const, priority: 0.45 })),
    ...catalogCategories.map((category) => ({ url: `${siteUrl}/materials/${category.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...demoProducts.filter(isPublicConstructionProduct).map((product) => ({ url: `${siteUrl}/materials/${product.category}/${product.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...articles.map((article) => ({
      url: `${siteUrl}/blog/${article.slug}`,
      lastModified: new Date(`${article.updatedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
