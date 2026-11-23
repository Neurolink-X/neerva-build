import Link from "next/link";

export function SiteHeader() {
  return <><div className="topline"><span>Materials, planning and dealer quotes in one place</span><span>India · INR</span></div><header className="site-header"><Link className="brand" href="/" aria-label="NEERVA BUILD home"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link><nav className="desktop-nav" aria-label="Main navigation"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/quotes">Get a quote</Link><Link href="/design-studio">Home studio</Link><Link href="/calculators">Calculators</Link><Link href="/blog">Guides</Link></nav><Link className="button button-dark button-small header-quote" href="/quotes">Start a quote</Link></header></>;
}

export function SiteFooter() {
  return <footer className="site-footer"><Link className="brand brand-footer" href="/"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link><span>Build better. Buy smarter.</span><nav aria-label="Footer"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/quotes">Quotes</Link><Link href="/design-studio">Home studio</Link><Link href="/blog">Guides</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/returns">Returns</Link></nav><small>© 2026 NEERVA BUILD · Live prices and stock will appear only from verified dealer data.</small></footer>;
}
