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
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [showSuggestions, setShowSuggestions] = useState(false);
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
      <div className="topline"><span>Materials, planning and dealer quotes in one place</span><span>Concept plans · itemised quotes · no invented rates</span></div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="NEERVA BUILD home"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></a>
        <nav className="desktop-nav" aria-label="Main navigation"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/quotes">Bulk quotes</Link><Link href="/design-studio">Home studio</Link><Link href="/calculators">Calculators</Link><Link href="/blog">Guides</Link></nav>
        <div className="header-actions"><label className="city-select"><span aria-hidden="true">⌖</span><select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Choose city"><option>Kanpur</option><option>Noida</option><option value="Other city">Check another city</option></select></label><button type="button" className="home-language" aria-label="Switch language" onClick={() => setLanguage(language === "en" ? "hi" : "en")}>{language === "en" ? "हिंदी" : "EN"}</button><Link className="home-cart" href="/basket" aria-label="Open material basket">▣</Link><Link className="sign-in" href="/account">Sign in</Link></div>
      </header>

      <section className="hero home-v2-hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> {language === "en" ? "YOUR HOME. YOUR VISION." : "आपका घर, आपकी पसंद"}</div>
          <h1>{language === "en" ? <>Plan your home.<br /><span>See it your way.</span></> : <>अपने घर का प्लान बनाएं।<br /><span>रंगों में देखें।</span></>}</h1>
          <p>{language === "en" ? "Designs, colours and material quotes." : "घर के डिज़ाइन, रंग और सामग्री के कोटेशन।"}</p>
          <div className="home-journeys">
            <Link href="/design-studio" className="home-journey home-journey-primary"><span className="home-journey-icon" aria-hidden="true">⌂</span><span><strong>{language === "en" ? "Design my home" : "घर का डिज़ाइन बनाएं"}</strong><small>{language === "en" ? "Explore plans for your plot" : "अपने प्लॉट के लिए प्लान देखें"}</small></span><span aria-hidden="true">→</span></Link>
            <div className="home-journey-pair">
              <Link href="/design-studio/visualizer" className="home-journey"><span className="home-journey-icon" aria-hidden="true">◉</span><strong>{language === "en" ? "See it in my colours" : "अपने रंगों में देखें"}</strong><small>{language === "en" ? "Preview wall finishes" : "दीवारों के रंग देखें"}</small></Link>
              <Link href="/quotes" className="home-journey"><span className="home-journey-icon" aria-hidden="true">▤</span><strong>{language === "en" ? "Get material quote" : "सामग्री का कोटेशन"}</strong><small>{language === "en" ? "Review delivered costs" : "पूरी लागत की जानकारी"}</small></Link>
            </div>
          </div>
          <form className="hero-search home-v2-search" action="/materials" method="get">
            <span className="search-glyph" aria-hidden="true">⌕</span>
            <input value={query} onFocus={() => setShowSuggestions(true)} onChange={(event) => {setQuery(event.target.value);setShowSuggestions(true);}} name="search" placeholder={language === "en" ? "Search cement, TMT, bricks, pipes…" : "सीमेंट, सरिया, ईंट, पाइप खोजें…"} aria-label="Search construction materials" autoComplete="off" />
            <button className="button button-orange" type="submit">{language === "en" ? "Search" : "खोजें"} <span aria-hidden="true">→</span></button>
          </form>
          {showSuggestions && <div className="home-suggestions" aria-label="Popular material searches">{["cement","TMT","bricks","pipes"].map(term=><Link key={term} href={"/materials?search="+encodeURIComponent(term)} onClick={()=>setShowSuggestions(false)}>{term}</Link>)}</div>}
          <div className="hero-meta"><span><i className="check-dot">✓</i> {language === "en" ? "Itemised quote terms" : "मदवार कोटेशन"}</span><span><i className="check-dot">✓</i> {language === "en" ? "Dealer status disclosed" : "डीलर की स्थिति स्पष्ट"}</span><span><i className="check-dot">✓</i> {language === "en" ? "Review before accepting" : "स्वीकारने से पहले जांचें"}</span></div>
          {city === "Other city" && <p className="home-city-notice" role="status">Serviceability outside Kanpur is checked for each request. No delivery availability is guaranteed.</p>}
        </div>
        <Link href="/design-studio/visualizer" className="hero-art home-v2-visual" aria-label="Open the home colour visualizer">
          <div className="sun" />
          <div className="building"><div className="roof" /><div className="floor floor-top"><i /><i /><i /></div><div className="floor floor-bottom"><i /><i /><i /></div><div className="door" /><div className="foundation" /></div>
        </Link>
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

      <section className="section city-section"><div className="city-card"><div><div className="eyebrow">START LOCAL, STAY OPEN</div><h2>Building in {city === "Other city" ? "another city" : city}?</h2><p>City selection helps route enquiries. A delivery promise appears only when an approved dealer confirms stock, location and capacity.</p></div><div className="city-options"><button className={city === "Kanpur" ? "city-option selected" : "city-option"} onClick={() => setCity("Kanpur")}><span>Kanpur</span><small>Initial market</small></button><button className={city === "Noida" ? "city-option selected" : "city-option"} onClick={() => setCity("Noida")}><span>Noida</span><small>Next focus</small></button><button className={city === "Other city" ? "city-option selected" : "city-option"} onClick={() => setCity("Other city")}><span>Check another city</span><small>Availability checked per request</small></button></div></div></section>

      <section className="footer-cta"><div><div className="eyebrow eyebrow-light">BUILDING SHOULD FEEL LESS UNCERTAIN</div><h2>Start with the full picture.</h2><p>Compare the material, delivery and site requirements before placing an order.</p></div><Link href="/materials" className="button button-orange">Explore materials <span>→</span></Link></section>
      <footer id="guides"><a className="brand brand-footer" href="#top"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></a><span>Build better. Buy smarter.</span><nav><a href="#materials">Materials</a><a href="#quotes">Quotes</a><a href="#studio">Home Studio</a><a href="#calculator">Calculator</a><Link href="/blog">Guides</Link></nav><small>© 2026 NEERVA BUILD · Prices and coverage appear only from verified current data.</small></footer>
    </main>
  );
}
