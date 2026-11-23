import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function NotFound() {
  return <main className="catalog-page"><SiteHeader /><section className="friendly-error-page"><span className="eyebrow">PAGE NOT FOUND · 404</span><h1>That page has moved or is unavailable.</h1><p>Your saved material list stays on this device. Browse the catalog or start a quote and we’ll help you find the right product.</p><div className="friendly-error-actions"><Link className="button button-orange" href="/materials">Browse materials</Link><Link className="button button-outline" href="/quotes">Start a quote</Link><Link className="text-link" href="/">Go to home <span>→</span></Link></div></section><SiteFooter /></main>;
}
