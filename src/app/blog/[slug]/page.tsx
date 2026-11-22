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
    description: article.excerpt,
    datePublished: `${article.publishedAt}T00:00:00.000Z`,
    dateModified: `${article.updatedAt}T00:00:00.000Z`,
    inLanguage: ["en-IN", "hi-IN"],
    mainEntityOfPage: `${siteUrl}/blog/${article.slug}`,
    publisher: { "@type": "Organization", name: "NEERVA BUILD", url: siteUrl },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export default async function BlogArticlePage({ params, searchParams }: PageProps) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const article = getArticle(slug);
  if (!article) notFound();
  const isHindi = search.lang === "hi";
  const title = isHindi ? article.titleHi : article.title;
  const excerpt = isHindi ? article.excerptHi : article.excerpt;
  const sections = isHindi ? article.sectionsHi : article.sections;
  const published = new Date(`${article.publishedAt}T00:00:00Z`).toLocaleDateString(isHindi ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <main className="article-page">
      <JsonLd article={article} />
      <header className="blog-header">
        <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link>
        <nav aria-label="Article navigation"><Link href="/">Home</Link><Link href="/blog">Guides</Link><Link className="button button-dark button-small" href="/#quotes">Request a quote</Link></nav>
      </header>
      <div className="article-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/blog">Knowledge Hub</Link><span>/</span><span>{isHindi ? "खरीद गाइड" : article.category}</span></div>
      <article>
        <header className="article-hero">
          <div className="article-kicker"><span>{isHindi ? "खरीद गाइड" : article.category}</span><span>·</span><span>{article.readMinutes} {isHindi ? "मिनट पढ़ें" : "min read"}</span></div>
          <h1>{title}</h1>
          <p>{excerpt}</p>
          <div className="article-byline"><span className="article-avatar">N</span><span><strong>NEERVA BUILD</strong><small>{isHindi ? "प्रकाशित" : "Published"} {published} · {isHindi ? "अपडेट" : "Updated"} {published}</small></span><div className="language-switch" aria-label="Choose article language"><Link href={`/blog/${article.slug}`} aria-current={!isHindi ? "page" : undefined}>EN</Link><Link href={`/blog/${article.slug}?lang=hi`} aria-current={isHindi ? "page" : undefined}>हिंदी</Link></div></div>
        </header>
        <div className="article-layout">
          <aside className="article-toc"><strong>{isHindi ? "इस लेख में" : "IN THIS GUIDE"}</strong>{sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.heading}</a>)}</aside>
          <div className="article-body">
            {sections.map((section) => <section id={section.id} className="article-section" key={section.id}><h2>{section.heading}</h2>{section.blocks.map((block, index) => {
              if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
              if (block.type === "list") return <ul key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
              return <aside className="article-callout" key={index}><strong>{block.title}</strong><p>{block.text}</p></aside>;
            })}</section>)}
            <section className="article-sources"><h2>{isHindi ? "आधिकारिक स्रोत" : "Official references"}</h2><p>{isHindi ? "यह गाइड सामान्य खरीद जानकारी है। लागू नियम उत्पाद और लेन-देन के अनुसार बदल सकते हैं।" : "This guide is general buying information. Applicable requirements can vary by product and transaction."}</p><ul>{article.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label}<span aria-hidden="true"> ↗</span></a></li>)}</ul><small>{isHindi ? "जानकारी 22 नवंबर 2026 को देखी गई। टैक्स या अनुपालन के निर्णय के लिए योग्य सलाह लें।" : "References checked on 22 November 2026. Seek qualified advice for tax or compliance decisions."}</small></section>
          </div>
        </div>
      </article>
      <section className="article-next"><div><div className="eyebrow eyebrow-light">{isHindi ? "अगला कदम" : "PUT IT INTO PRACTICE"}</div><h2>{isHindi ? "अपनी सामग्री की ज़रूरत स्पष्ट करें।" : "Get the material requirement clear."}</h2><p>{isHindi ? "मात्रा, यूनिट और डिलीवरी लोकेशन के साथ निजी कोटेशन अनुरोध तैयार करें।" : "Prepare a private quotation request with your quantity, unit and delivery location."}</p></div><Link href="/#request" className="button button-orange">{isHindi ? "कोटेशन माँगें" : "Request a quote"} <span>→</span></Link></section>
      <footer className="blog-footer"><Link href="/" className="brand brand-footer"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link><span>Build better. Buy smarter.</span><Link href="/blog">More guides →</Link></footer>
    </main>
  );
}
