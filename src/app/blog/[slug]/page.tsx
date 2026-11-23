import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticle } from "@/modules/blog/articles";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> };

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Guide not found", robots: { index: false, follow: false } };
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/blog/${article.slug}`, languages: { "en-IN": `/blog/${article.slug}`, "hi-IN": `/blog/${article.slug}?lang=hi` } },
    openGraph: { type: "article", url: `/blog/${article.slug}`, title: article.title, description: article.excerpt, publishedTime: `${article.publishedAt}T00:00:00.000Z`, modifiedTime: `${article.updatedAt}T00:00:00.000Z`, authors: ["NEERVA BUILD"] },
    twitter: { card: "summary_large_image", title: article.title, description: article.excerpt },
  };
}

function JsonLd({ article }: { article: NonNullable<ReturnType<typeof getArticle>> }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: a¶»§q«^