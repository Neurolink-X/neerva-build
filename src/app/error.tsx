"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Next.js forwards the sanitized digest to its server-side error channel.
    // Never render raw exception messages that may contain private request data.
    console.error("Neerva page boundary caught an unhandled page error", { digest: error.digest });
  }, [error]);

  return <main className="catalog-page"><section className="friendly-error-page" role="alert"><span className="eyebrow">TEMPORARY PAGE ISSUE</span><h1>We couldn’t load this page.</h1><p>Your saved material list stays safe. Try the page again, or continue browsing while we work to restore the service.</p>{error.digest && <p className="error-reference">Reference: {error.digest}</p>}<div className="friendly-error-actions"><button className="button button-orange" type="button" onClick={reset}>Try again</button><Link className="button button-outline" href="/materials">Browse materials</Link><Link className="text-link" href="/basket">Open saved material list <span>→</span></Link></div></section></main>;
}
