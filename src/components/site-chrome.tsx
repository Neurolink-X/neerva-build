import Link from "next/link";

export function SiteHeader(){
 return <><div className="topline" aria-label="Delivery disclaimer"><span>Made for India’s builders</span><span>Availability checked at quotation · no automatic location selection</span></div>
 <header className="site-header"><Link className="brand" href="/" aria-label="NEERVA BUILD home"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link>
  <nav className="desktop-nav" aria-label="Main navigation"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/design-studio">Plan my home</Link><Link href="/quotes">Get a quote</Link><Link href="/blog">Guides</Link></nav>
  <details className="site-mobile-menu"><summary>Menu</summary><nav aria-label="Mobile navigation"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/design-studio">Plan my home</Link><Link href="/quotes">Prepare quote</Link><Link href="/install">Install app</Link><Link href="/account">Account</Link><Link href="/basket">Material list</Link><Link href="/blog">Guides</Link></nav></details>
  <div className="header-utility"><Link className="header-install" href="/install" aria-label="Install NEERVA BUILD app">Install app</Link><Link className="button button-dark button-small header-quote" href="/quotes">Prepare quote →</Link></div></header></>;
}
export function SiteFooter(){
 return <footer className="site-footer" aria-label="NEERVA BUILD footer">
  <div className="site-footer-brand"><Link className="brand brand-footer" href="/"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link><strong>Every dream home strengthens India&apos;s future.</strong><p>Explore material specifications, choose a plot-fitting concept and prepare clear requirements. Real dealer rates, stock and deliveries are confirmed separately.</p></div>
  <nav aria-label="Explore"><strong>Explore</strong><Link href="/materials">Construction materials</Link><Link href="/brands">Material brands</Link><Link href="/quotes">Prepare a dealer quote</Link><Link href="/basket">Material list</Link></nav>
  <nav aria-label="Home planning"><strong>Home Studio</strong><Link href="/design-studio">Start my home plan</Link><Link href="/design-studio/portfolio">Plot-specific layouts</Link><Link href="/design-studio/fit">Check plot fit</Link><Link href="/design-studio/visualizer">Try wall colours</Link><Link href="/studio-pricing">Studio plans · free / ₹149</Link></nav>
  <nav aria-label="Help and policies"><strong>Support & legal</strong><Link href="/install">Install app</Link><Link href="/account">Account access</Link><Link href="/blog">Building guides</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms</Link><Link href="/returns">Returns & refunds</Link><Link href="/support">Payment & customer help</Link><Link href="/learn">Home planning knowledge hub</Link></nav>
  <div className="site-footer-bottom"><small>© 2026 NEERVA BUILD · Made for India’s builders</small><small>Architect sign-off required for designs. No unverified dealer prices, fake discounts or stock claims.</small></div>
 </footer>;
}
