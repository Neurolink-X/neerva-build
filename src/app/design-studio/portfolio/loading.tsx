/** A route-scoped fallback: the portfolio handles invalid briefs explicitly. No network, JS or external imagery. */
export default function Loading(){return <main className="neerva-route-loading" aria-busy="true"><h1>Opening page…</h1><p role="status">Preparing your next view.</p><div aria-hidden="true" className="neerva-loading-placeholder"><span/><span/><span/></div></main>}
