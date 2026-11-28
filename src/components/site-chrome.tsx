import Link from "@/components/intent-link";
import {InstallLink,FooterAppAccess} from "@/components/pwa-install";
import {MobileNavigation} from "@/components/mobile-navigation";
import {ShopCartLink} from "@/components/shop-cart";
import {footerGroups,footerPolicies} from "@/modules/navigation/footer-links";

export function SiteHeader(){
 return <><div className="topline" aria-label="Delivery disclaimer"><span>Made for India’s builders</span><span>Confirm delivery availability with your quotation</span></div>
 <header className="site-header"><Link className="brand" href="/" aria-label="NEERVA BUILD home"><span className="brand-mark">N</span><span>NEERVA <b>BUILD</b></span></Link>
  <nav className="desktop-nav" aria-label="Main navigation"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/design-studio">Plan my home</Link><Link href="/quotes" prefetch={false}>Get a quote</Link><Link href="/blog">Blog & guides</Link></nav>
  <MobileNavigation className="site-mobile-menu"><Link href="/materials">Materials</Link><Link href="/brands">Brands</Link><Link href="/design-studio">Plan my home</Link><Link href="/quotes" prefetch={false}>Prepare quote</Link><InstallLink recoveryLabel="App help">Install app</InstallLink><Link href="/account" prefetch={false}>Account</Link><Link href="/checkout?cart=1" prefetch={false}>Cart</Link><Link href="/basket?view=planner" prefetch={false}>Project material planner</Link><Link href="/my-project">My Project</Link><Link href="/account/orders" prefetch={false}>My Orders</Link><Link href="/build-iq">Academy</Link><Link href="/blog">Blog & guides</Link></MobileNavigation>
  <div className="header-utility"><ShopCartLink/><Link className="button button-dark button-small header-quote" href="/quotes" prefetch={false}>Prepare quote →</Link></div></header></>;
}
export function SiteFooter({language="en"}:{language?:"en"|"hi"}={}){
 const hi=language==="hi",locale=hi?1:0;
 return <footer className="site-footer unified-footer" aria-label={hi?"नीरवा बिल्ड वेबसाइट लिंक":"NEERVA BUILD footer"} lang={hi?"hi":"en"}>
  <div className="unified-footer-inner">
   <div className="unified-footer-intro">
    <div className="unified-footer-identity">
     <Link className="brand brand-footer" href="/" aria-label="NEERVA BUILD home"><span className="brand-mark" aria-hidden="true">N</span><span>NEERVA <b>BUILD</b></span></Link>
     <h2>{hi?"अपने सपनों का घर बनाएं।":"Build with clarity."}</h2>
     <p>{hi?"सामग्री समझें, घर की योजना बनाएं और सही जानकारी के साथ खरीदारी करें।":"Compare materials, plan your home and make informed construction decisions."}</p>
    </div>
    <div className="unified-footer-actions">
     <Link href="/materials" prefetch={false}>{hi?"सामग्री देखें":"Explore materials"} <span aria-hidden="true">→</span></Link>
     <Link href="/design-studio" prefetch={false}>{hi?"घर की योजना बनाएं":"Plan my home"} <span aria-hidden="true">→</span></Link>
    </div>
   </div>
   <div className="unified-footer-groups">
    {footerGroups.map(group=><nav key={group.id} aria-label={group.title[locale]}>
     <h3>{group.title[locale]}</h3>
     <ul>{group.links.map(([href,en,hindi])=><li key={href}><Link href={href} prefetch={false} data-intent-prefetch="">{hi?hindi:en}</Link></li>)}</ul>
    </nav>)}
   </div>
   <FooterAppAccess language={language}/>
   <div className="unified-footer-bottom">
    <div className="unified-footer-legal" role="group" aria-label={hi?"नीतियाँ":"Legal policies"}>
     {footerPolicies.map(([href,en,hindi])=><Link key={href} href={href} prefetch={false}>{hi?hindi:en}</Link>)}
    </div>
    <small>© 2026 NEERVA BUILD · {hi?"भारत के लिए निर्मित":"Made for India"}</small>
    <small className="unified-footer-note">{hi?"निर्माण से पहले पेशेवर जाँच आवश्यक है। स्टॉक, कीमत और डिलीवरी डीलर से पुष्टि करें।":"Concept designs require professional review. Stock, prices and delivery require dealer confirmation."}</small>
   </div>
  </div>
 </footer>;
}
