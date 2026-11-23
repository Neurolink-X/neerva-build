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
        <nav aria-label="Blog navigation"><Link href="/">Home</Link><Link href="/blog" aria-current="page">Guides</Link><Link className="button button-dark button-small" href="/#quotes">Request a quote</Link></nav>
      </header>
      <section className="blog-hero">
        <div className="eyebrow"><span className="eyebrow-dot" /> THE NEERVA KNOWLEDGE HUB</div>
        <h1>Build with <span>more clarity.</span></h1>
        <p>Practical guides to help you understand materials, compare offers and ask better questions before a purchase.</p>
        <div className="blog-hero-meta"><span>Buying guides</span><span>Â·</span><span>English and Hindi</span><span>Â·</span><spa¶»§q«^