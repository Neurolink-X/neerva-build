"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogCategory } from "@/modules/catalog/catalog";
import { searchCategories } from "@/modules/catalog/catalog";
import { convertSquareFeet, squareFeetFromDimensions } from "@/modules/calculator/units";
import { QuoteRequestForm } from "@/components/quote-request-form";

const icons: Record<CatalogCategory["icon"], string> = {
  steel: "▤", cement: "◈", brick: "▦", pipe: "◉", electric: "⌁", aggregate: "◌",
};

const steps = ["Share your material list", "Dealers send itemized offers", "Compare the full delivered cost"];

export function HomeShell({ categories }: { categories: CatalogCategory[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Kanpur");
  const [length, setLength] = useState("20");
  const [width, setWidth] = useState("40");
  const [unit, setUnit] = useState<"ft" | "m">("ft");
  const results = useMemo(() => searchCategories(query, categories), [query, categories]);
  const calculation = useMemo(() => {
    try {
      return { area: convertSquareFeet(squareFeetFromDimensions(Number(length), Number(width), unit)), error: "" };
    } catch {
      return { area: null, error: "Enter positive plot dimensions." };
    }
  }, [length, width, unit]);
  const { area, error: calcError } = calculation;

  return (
    <main>
      <div className="topline"><span>Materials, planning and dealer quotes in one place</span><span>English <b>·</b> हिन्दी coming soon</span></div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="NEERVA BUILD home"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></a>
        <nav className="desktop-nav" aria-label="Main navigation"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/quotes">Bulk quotes</Link><Link href="/design-studio">Home studio</Link><Link href="/calculators">Calculators</Link><Link href="/blog">Guides</Link></nav>
        <div className="header-actions"><label className="city-select"><span aria-hidden="true">⌖</span><select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Choose city"><option>Kanpur</option><option>Noida</option><option>Other city</option></select></label><a className="sign-in" href="#account">Sign in</a><a className="button button-dark button-small" href="#quotes">Get a quote</a></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> BUILT FOR INDIAN BUILDERS & HOMEOWNERS</div>
          <h1>Build better.<br /><span>Buy smarter.</span></h1>
          <p>Compare materials, get clear dealer quotes and plan your home—without the guesswork.</p>
          <form className="hero-search" action="/materials" method="get">
            <span className="search-glyph" aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} name="search" placeholder="Search steel, cement, bricks, pipes…" aria-label="Search construction materials" />
            <button className="button button-orange" type="submit">Search <span aria-hidden="true">→</span></button>
          </form>
          <div className="hero-meta"><span><i className="check-dot">✓</i> No made-up prices</span><span><i className="check-dot">✓</i> Dealer quotes itemized</span><span><i className="check-dot">✓</i> Start in {city === "Other city" ? "your city" : city}</span></div>
        </div>
        <div className="hero-art" aria-label="Illustration of a home under construction">
          <div className="sun" />
          <div className="art-label"><span className="art-live-dot" /> PLAN WITH CONFIDENCE</div>
          <div className="building"><div className="roof" /><div className="floor floor-top"><i /><i /><i /></div><div className="floor floor-bottom"><i /><i /><i /></div><div className="door" /><div className="foundation" /></div>
          <div className="art-note"><strong>One project.</strong><span>Every material, accounted for.</span></div>
          <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✳</div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Service principles"><div><span className="trust-icon">01</span><span><strong>Know what you’re buying</strong><small>Useful specifications, not vague listings</small></span></div><div><span className="trust-icon">02</span><span><strong>See the complete quote</strong><small>Material, freight and charges shown clearly</small></span></div><div><span className="trust-icon">03</span><span><strong>Stay in control</strong><small>Accept only after you review the terms</small></span></div></section>

      <section className="section materials-section" id="materials">
        <div className="section-head"><div><div className="eyebrow">THE MATERIALS YOU NEED</div><h2>Start with the right material.</h2><p>Browse categories. Live dealer inventory and rates appear only when verified data is connected.</p></div><a href="#quotes" className="text-link">Need bulk quantities? <span>Request a quote →</span></a></div>
        <div className="category-grid">{results.map((category, index) => <Link href={category.quoteOnly ? `/quotes?category=${category.slug}` : `/materials/${category.slug}`} className={`category-card card-${category.icon}`} key={category.slug}><div className="category-top"><span className="category-icon" aria-hidden="true">{icons[category.icon]}</span><span className="category-number">0{index + 1}</span></div><h3>{category.title}</h3><p>{category.description}</p><div className="category-bottom"><span>{category.quoteOnly ? "Private quotation" : "See specifications"}</span><span className="arrow">↗</span></div></Link>)}</div>
        {results.length === 0 && <div className="empty-search">No category matches “{query}”. Try steel, cement, bricks, pipes or aggregates.</div>}
      </section>

      <section className="quote-band" id="quotes"><div className="quote-copy"><div className="eyebrow eyebrow-light">BULK BUYING, MADE CLEAR</div><h2>One site. Multiple dealer offers.</h2><p>For balu, morang and other bulk materials, request private itemized quotations. Compare freight, tax, unloading, availability and delivery terms before you accept.</p><Link className="button button-light" href="/quotes">Prepare your request <span>→</span></Link><div className="quote-steps">{steps.map((step, index) => <div key={step}><span>0{index + 1}</span>{step}</div>)}</div></div><div className="quote-visual"><div className="quote-card quote-card-back"><span>Dealer offer</span><i /></div><div className="quote-card quote-card-front"><div className="quote-card-head"><span>QUOTE COMPARISON</span><span className="quote-status">PRIVATE</span></div><div className="quote-line"><span>Material & quantity</span><b>Itemized</b></div><div className="quote-line"><span>Freight & unloading</span><b>Shown clearly</b></div><div className="quote-line"><span>Delivery schedule</span><b>Confirmed first</b></div><div className="quote-total"><span>Final amount</span><strong>Before you accept</strong></div></div></div></section>
      <section className="section rfq-intake-section" id="request"><div className="rfq-intro"><div className="eyebrow">PRIVATE, ITEMIZED QUOTATIONS</div><h2>Tell us what your site needs.</h2><p>Send your material, quantity and delivery location. We’ll show whether secure quote intake is available after the request is checked.</p><ul><li>Dealer offers stay private</li><li>Freight and unloading are itemized</li><li>No commitment before you accept</li></ul></div><QuoteRequestForm defaultCity={city === "Other city" ? "" : city} /></section>

      <section className="section calculator-section" id="calculator"><div className="calculator-intro"><div className="eyebrow">A CLEARER START</div><h2>Measure once.<br /><span>Plan with clarity.</span></h2><p>Convert plot dimensions without mixing up square gaj and linear measurements.</p><p className="formula-note">1 square gaj = 9 square feet</p><a className="text-link" href="#guides">Explore construction guides <span>→</span></a></div><div className="calculator-card"><div className="calculator-card-head"><div><span className="calculator-icon">▦</span><div><strong>Plot area calculator</strong><small>Estimate the plot footprint</small></div></div><span className="calculator-tag">BASIC ESTIMATE</span></div><div className="input-row"><label>Length<input inputMode="decimal" value={length} onChange={(event) => setLength(event.target.value)} aria-label="Plot length" /></label><label>Width<input inputMode="decimal" value={width} onChange={(event) => setWidth(event.target.value)} aria-label="Plot width" /></label><label>Unit<select value={unit} onChange={(event) => setUnit(event.target.value as "ft" | "m")} aria-label="Dimension unit"><option value="ft">Feet</option><option value="m">Metres</option></select></label></div>{calcError ? <p className="calc-error" role="alert">{calcError}</p> : area && <div className="area-results"><div><strong>{area.squareFeet.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong><span>sq ft</span></div><div><strong>{area.squareGaj.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong><span>square gaj</span></div><div><strong>{area.squareMetres.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong><span>sq m</span></div></div>}<div className="calculator-foot"><span>Plot area is not the same as permissible construction area.</span><span aria-hidden="true">ⓘ</span></div></div></section>

      <section className="studio-section" id="studio"><div className="studio-visual"><div className="blueprint-grid" /><div className="blueprint-house"><div className="room room-one"><span>BEDROOM</span><b>12 ft × 11 ft</b></div><div className="room room-two"><span>LIVING</span><b>15 ft × 12 ft</b></div><div className="room room-three"><span>KITCHEN</span><b>9 ft × 8 ft</b></div><div className="room room-four"><span>COURTYARD</span><b>OPEN TO SKY</b></div><span className="dimension dimension-width">20 ft</span><span className="dimension dimension-height">40 ft</span></div><span className="blueprint-caption">CONCEPTUAL PLAN · 20 × 40 FT</span></div><div className="studio-copy"><div className="eyebrow">A HOME, BEFORE THE FIRST BRICK</div><h2>Compare different plans for the same plot.</h2><p>Explore curated layout concepts by plot size, room needs and orientation. Save options and ask a qualified professional to review them.</p><div className="studio-pills"><span>2D plan concepts</span><span>Multiple layouts</span><span>Professional review</span></div><p className="disclaimer">Conceptual design only. Final drawings, structural safety and local approvals require qualified professional review.</p><Link href="/design-studio" className="button button-dark">Explore the Home Studio <span>→</span></Link><Link href="/design-studio/visualizer" className="home-visualizer-link">Try wall colours, balcony glass and gate finishes →</Link></div></section>

      <section className="section city-section"><div className="city-card"><div><div className="eyebrow">START LOCAL, STAY OPEN</div><h2>Building in {city === "Other city" ? "another city" : city}?</h2><p>City selection helps route enquiries. A delivery promise appears only when an approved dealer confirms stock, location and capacity.</p></div><div className="city-options"><button className={city === "Kanpur" ? "city-option selected" : "city-option"} onClick={() => setCity("Kanpur")}><span>Kanpur</span><small>Initial market</small></button><button className={city === "Noida" ? "city-option selected" : "city-option"} onClick={() => setCity("Noida")}><span>Noida</span><small>Next focus</small></button><button className={city === "Other city" ? "city-option selected" : "city-option"} onClick={() => setCity("Other city")}><span>Other city</span><small>Availability checked per request</small></button></div></div></section>

      <section className="footer-cta"><div><div className="eyebrow eyebrow-light">BUILDING SHOULD FEEL LESS UNCERTAIN</div><h2>Start with the full picture.</h2><p>Compare the material, delivery and site requirements before placing an order.</p></div><Link href="/materials" className="button button-orange">Explore materials <span>→</span></Link></section>
      <footer id="guides"><a className="brand brand-footer" href="#top"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></a><span>Build better. Buy smarter.</span><nav><a href="#materials">Materials</a><a href="#quotes">Quotes</a><a href="#studio">Home Studio</a><a href="#calculator">Calculator</a><Link href="/blog">Guides</Link></nav><small>© 2026 NEERVA BUILD · Prices and coverage appear only from verified current data.</small></footer>
    </main>
  );
}
