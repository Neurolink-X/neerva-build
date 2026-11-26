import Link from "next/link";
import {ShopCartLink} from "@/components/shop-cart";

export function SiteHeader(){
 return <><div className="topline" aria-label="Delivery disclaimer"><span>Made for India’s builders</span><span>Availability checked at quotation · no automatic location selection</span></div>
 <header className="site-header"><Link className="brand" href="/" aria-label="NEERVA BUILD home"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link>
  <nav className="desktop-nav" aria-label="Main navigation"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/design-studio">Plan my home</Link><Link href="/quotes" prefetch={false}>Get a quote</Link><Link href="/blog">Blog & guides</Link></nav>
  <details className="site-mobile-menu"><summary>Menu</summary><nav aria-label="Mobile navigation"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/design-studio">Plan my home</Link><Link href="/quotes" prefetch={false}>Prepare quote</Link><Link href="/install" prefetch={false}>Install app</Link><Link href="/account" prefetch={false}>Account</Link><Link href="/checkout?cart=1" prefetch={false}>Cart</Link><Link href="/basket?view=planner" prefetch={false}>Project material planner</Link><Link href="/my-project">My Project</Link><Link href="/account/orders" prefetch={false}>My Orders</Link><Link href="/build-iq">Academy</Link><Link href="/blog">Blog & guides</Link></nav></details>
  <div className="header-utility"><ShopCartLink/><Link className="header-install" href="/install" prefetch={false} aria-label="Install NEERVA BUILD app">Install app</Link><Link className="button button-dark button-small header-quote" href="/quotes" prefetch={false}>Prepare quote →</Link></div></header></>;
}
export function SiteFooter({language="en"}:{language?:"en"|"hi"}={}){
 const hi=language==="hi";
 const groups=[
  {title:hi?"सामग्री और खरीदारी":"Materials & orders",links:[["/materials","Construction materials","निर्माण सामग्री"],["/brands","Material brands","मटेरियल ब्रांड"],["/checkout?cart=1","Shopping cart","कार्ट"],["/basket?view=planner","Project material planner","सामग्री योजना"],["/quotes","Prepare a quote","कोटेशन बनाएं"],["/account/orders","My orders","मेरे ऑर्डर"],["/account/quotes","My quotations","मेरे कोटेशन"]]},
  {title:hi?"होम स्टूडियो":"Home Studio",links:[["/design-studio","Plan my home","घर का प्लान"],["/design-studio/portfolio","2D + 3D layouts","2D + 3D नक्शे"],["/design-studio/fit","Check plot fit","प्लॉट की जाँच"],["/design-studio/visualizer","Paint Studio","कलर स्टूडियो"],["/studio-pricing","Studio pricing","स्टूडियो मूल्य"],["/family-homes","Family home ideas","घर के विचार"]]},
  {title:hi?"संसाधन":"Resources",links:[["/blog","Blog & buying guides","ब्लॉग और गाइड"],["/learn","Knowledge hub","जानकारी केंद्र"],["/my-project","My Project","मेरा प्रोजेक्ट"],["/build-iq","Neerva Academy","नीरवा अकादमी"],["/business-model","Dealer information","डीलर जानकारी"],["/account","Account access","अकाउंट"],["/install","Install the app","ऐप इंस्टॉल"]]},
  {title:hi?"सहायता और नीतियाँ":"Help & policies",links:[["/support","Customer support","ग्राहक सहायता"],["/privacy","Privacy policy","गोपनीयता"],["/terms","Terms of service","नियम और शर्तें"],["/returns","Returns & refunds","वापसी और रिफंड"]]}
 ];
 return <footer className="site-footer unified-footer" aria-label="NEERVA BUILD footer">
  <div className="unified-footer-inner">
   <div className="unified-footer-intro"><div><Link className="brand brand-footer" href="/"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link><h2>{hi?"अपने सपनों का घर बनाएं।":"Build with clarity."}</h2><p>{hi?"सामग्री समझें, घर की योजना बनाएं और सही जानकारी के साथ खरीदारी करें।":"Compare materials, plan your home and make informed construction decisions."}</p></div><div className="unified-footer-actions"><Link href="/materials">{hi?"सामग्री देखें":"Explore materials"} <span aria-hidden="true">→</span></Link><Link href="/design-studio">{hi?"घर की योजना बनाएं":"Plan my home"} <span aria-hidden="true">→</span></Link></div></div>
   <div className="unified-footer-groups">{groups.map(g=><nav key={g.title} aria-label={g.title}><h3>{g.title}</h3><div>{g.links.map(([href,en,hindi])=><Link key={href} href={href} prefetch={false} data-intent-prefetch="">{hi?hindi:en}</Link>)}</div></nav>)}</div>
   <div className="unified-footer-bottom"><small>© 2026 NEERVA BUILD · {hi?"भारत के लिए निर्मित":"Made for India"}</small><small>{hi?"निर्माण से पहले पेशेवर जाँच आवश्यक है। स्टॉक, कीमत और डिलीवरी डीलर से पुष्टि करें।":"Concept designs require professional review. Stock, prices and delivery require dealer confirmation."}</small></div>
  </div>
 </footer>;
}
