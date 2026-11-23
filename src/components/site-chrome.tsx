import Link from "next/link";
import { BasketLink } from "@/components/material-basket";

export function SiteHeader() {
  return <><div className="topline"><span>Materials, planning and dealer quotes in one place</span><span>India Â· INR</span></div><header className="site-header"><Link className="brand" href="/" aria-label="NEERVA BUILD home"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link><nav className="desktop-nav" aria-label="Main navigation"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/quotes">Get a quote</Link><Link href="/design-studio">Home studio</Link><Link href="/calculators">Calculators</Link><Link href="/blog">Guides</Link></nav><div className="header-market-actions"><BasketLink /><Link className="button button-dark button-small header-quote" href="/quotes">Start a quote</Link></div></header></>;
}

export function SiteFooter() {
  return <footer className="site-footer site-footer-rich"><div className="footer-brand-block"><Link className="brand brand-footer" href="/"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link><p>Build better. Buy smarter.</p><small>Construction materials, dealer quotes and home planningâ€”with clear terms before you commit.</small></div><div className="footer-link-group"><strong>Shop &amp; plan</strong><Link href="/materials">Browse materials</Link><Link href="/brands">Brand directory</Link><Link href="/basket">Your material list</Link><Link h¶»§q«^