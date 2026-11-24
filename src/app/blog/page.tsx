import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/modules/blog/articles";

export const metadata: Metadata = {
  title: "Construction Guides & Buying Advice",
  description: "Practical, source-linked guides for comparing construction material quotations, checking delivery terms and planning with confidence.",
  alternates: { canonical: "/blog" },
  openGraph: { type: "website", url: "/blog", title: "Construction Guides | NEERVA BUILD", description: "Practical construction buying guides for Indian homeowners and builders." },
};

export default function BlogIndexPage() {
  return (
    <main className="blog-page">
      <header className="blog-header">
        <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link>
        <nav aria-label="Blog navigation"><Link href="/">Home</Link><Link href="/blog" aria-current="page">Guides</Link><Link className="button button-dark button-small" href="/quotes">Request a quote</Link></nav>
      </header>
      <section className="blog-hero">
        <div className="eyebrow"><span className="eyebrow-dot" /> THE NEERVA KNOWLEDGE HUB</div>
        <h1>Build with <span>more clarity.</span></h1>
        <p>Practical guides to help you understand materials, compare offers and ask better questions before a purchase.</p>
        <div className="blog-hero-meta"><span>Buying guides</span><span>·</span><span>English and Hindi</span><span>·</span><span>Sources included</span></div>
      </section>
      <section className="blog-list" aria-labelledby="using-neerva"><h2 id="using-neerva">How to use Neerva Build</h2>
        <div className="blog-card-grid">{[
          ["Choose materials","Search by brand or category. Compare grade, diameter, finish and pack size. For tiles, check coverage per carton. For pipes, match the pipe and fitting sizes.","/materials","Browse materials"],
          ["Plan a house","Enter plot width, depth, road side and floors. Select a layout, compare its 2D and 3D views, then review the concept with your architect.","/design-studio","Open Design Studio"],
          ["Try a wall colour","Open the colour visualizer, select a reference room or your own photo, mark the wall and compare shades. Check a physical sample before buying paint.","/design-studio/visualizer","Try colours"],
          ["Prepare an enquiry","Review your material list, quantities and units. Enter your delivery city and pincode on the quote form. Check the submission status before expecting an offer.","/quotes","Prepare a quote"],
          ["Compare dealer offers","Sign in with the account used for your enquiry. Review item quantities, taxes, freight, unloading, validity and delivery dates before accepting an available offer.","/account/quotes","View my quotes"],
          ["Track a purchase","Open My Orders to check the recorded order status. For a delivery or quantity issue, keep the order reference and use Support.","/account/orders","View my orders"],
          ["Sell materials","Start dealer onboarding with shop details, material categories and service pincodes. After review, use the dealer dashboard to handle eligible enquiries.","/dealer","Dealer access"]
        ].map(([title,body,href,action])=><article key={href} className="blog-card"><div className="blog-card-content"><h3>{title}</h3><p>{body}</p><Link className="text-link" href={href}>{action} →</Link></div></article>)}</div>
      </section>
      <section className="blog-list" aria-labelledby="blog-list-title">
        <div className="blog-list-heading"><div><div className="eyebrow">LATEST GUIDE</div><h2 id="blog-list-title">Useful before you buy.</h2></div><span>{articles.length} {articles.length === 1 ? "article" : "articles"}</span></div>
        <div className="blog-card-grid">
          {articles.map((article) => (
            <article className="blog-card" key={article.slug}>
              <Link href={`/blog/${article.slug}`} className="blog-card-art" aria-label={`Read ${article.title}`}>
                <span className="blog-art-label">NEERVA FIELD GUIDE · 0{articles.indexOf(article) + 1}</span>
                <div className="quote-paper" aria-hidden="true"><span>Material</span><i /><span>Delivery</span><i /><span>Full amount</span><b>Clear first.</b></div>
                <span className="blog-art-arrow" aria-hidden="true">↗</span>
              </Link>
              <div className="blog-card-content"><div className="blog-card-meta"><span>{article.category}</span><span>·</span><span>{article.readMinutes} min read</span></div><h3><Link href={`/blog/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><div className="blog-card-bottom"><time dateTime={article.publishedAt}>{new Date(`${article.publishedAt}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time><Link href={`/blog/${article.slug}`} className="text-link">Read guide <span>→</span></Link></div></div>
            </article>
          ))}
        </div>
      </section>
      <aside className="blog-note"><span className="blog-note-icon">i</span><p>Construction decisions depend on the material, site and local requirements. Our guides help you prepare questions; they do not replace a qualified professional or product-specific documentation.</p></aside>
      <footer className="blog-footer"><Link href="/" className="brand brand-footer"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link><span>Build better. Buy smarter.</span><Link href="/materials">Explore materials →</Link></footer>
    </main>
  );
}
