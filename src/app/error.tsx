"use client";

import { useEffect } from "react";
import Link from "next/link";
import {usePublicPageRecovery} from "@/components/use-public-page-recovery";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  usePublicPageRecovery(reset);
  useEffect(() => {
    // Next.js forwards the sanitized digest to its server-side error channel.
    // Never render raw exception messages that may contain private request data.
    console.error("Neerva page boundary caught an unhandled page error", { digest: error.digest });
    window.dispatchEvent(new Event("neerva:page-error"));
  }, [error]);

  return <main className="catalog-page"><section className="friendly-error-page" role="alert"><span className="eyebrow">TEMPORARY PAGE ISSUE</span><h1>We couldn’t load this page.</h1><p lang="hi">पेज लोड नहीं हो पाया। फिर कोशिश करें; ऑर्डर या भुगतान दोबारा करने से पहले उसकी स्थिति जांचें।</p><p>Public information pages may retry once automatically. For an order or payment, check its status before repeating any action. You can also try again or continue browsing.</p>{error.digest && <p className="error-reference">Reference: {error.digest}</p>}<div className="friendly-error-actions"><button className="button button-orange" type="button" onClick={reset}>Try again</button><Link className="button button-outline" href="/materials">Browse materials</Link><Link className="text-link" href="/basket">Open saved material list <span>→</span></Link></div></section></main>;
}
