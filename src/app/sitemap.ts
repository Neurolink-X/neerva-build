import type { MetadataRoute } from "next";
import {publicIndexingEnabled} from "@/modules/seo/indexing";
import { articles } from "@/modules/blog/articles";
import { catalogCategories } from "@/modules/catalog/catalog";
import { demoProducts } from "@/modules/catalog/marketplace";
import { studioDesigns } from "@/modules/studio/library";

export default function sitemap(): MetadataRoute.Sitemap {
  if(!publicIndexingEnabled(process.env))return [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/materials`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/brands`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/calculators`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/design-studio/library`, changeFrequency: "monthly", priority: 0.6 },
    ...studioDesigns.map((design) => ({ url: `${siteUrl}/design-studio/library/${design.slug}`, changeFrequency: "monthly" as const, priority: 0.45 })),
    ...catalogCategories.map((category) => ({ url: `${siteUrl}/materials/${category.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...demoProducts.map((product) => ({ url: `${siteUrl}/materials/${product.category}/${product.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...articles.map((article) => ({
      url: `${siteUrl}/blog/${article.slug}`,
      lastModified: new Date(`${article.updatedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
