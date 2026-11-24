import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import "@/app/studio-pricing/pricing.css";
export const metadata:Metadata={title:"120, 130, 140, 150 Gaj Plot Sizes: Feet, Area & Home Plan",description:"Convert Indian gaj (square yards) to square feet. Learn why 120 gaj may be 20×54 ft and why front width, setbacks, road side and floor count change the plan.",alternates:{canonical:"/learn/plot-size-in-gaj"}};
const examples=[{gaj:120,feet:1080,w:20,d:54},{gaj:130,feet:1170,w:26,d:45},{gaj:140,feet:1260,w:20,d:63},{gaj:150,feet:1350,w:30,d:45}];
export default function GajGuide(){return <main className="catalog-page"><SiteHeader/>
<article className="studio-policy-document"><p className="eyebrow">PLOT MEASUREMENTS · 24 NOVEMBER 2026</p>
<h1>120–150 gaj plots: how much space is that, and what house can fit?</h1>
<p>In common North Indian land listings, one square gaj means <strong>one square yard = 9 square feet</strong>. The stated land area is not enough to design a house. Measure the width of the road-facing edge and the depth independently.</p>
<h2>Common plot sizes in gaj</h2>
<table className="studio-guide-table"><thead><tr><th>Area</th><th>Square feet</th><th>One possible rectangle</th></tr></thead><tbody>{examples.map(e=><tr key={e.gaj}><th>{e.gaj} gaj</th><td>{e.feet} sq ft</td><td>{e.w} × {e.d} ft</td></tr>)}</tbody></table>
<p>These dimensions are only mathematical examples. A 120 gaj site can have many other widths and depths that multiply to 1,080 sq ft. An L-shaped or irregular site requires its measured boundary diagram, not a rectangle guessed from area.</p>
<h2>Formula for your actual plot</h2><p><strong>Area in sq ft = gaj × 9.</strong> For a rectangular site: <strong>depth in feet = (gaj × 9) ÷ frontage in feet.</strong> For example, a 150 gaj site with 30 ft frontage gives 45 ft depth, while 20 ft frontage gives 67.5 ft depth.</p>
<h2>Why the same area gives a different naksha</h2><p>Room sizes depend on the road-facing width, entrance side, car parking, number of bedrooms, stairs, bath ventilation and setbacks. A plan with a driveway beside a veranda cannot simply be relabelled into one with a front bedroom or staircase; its circulation, doors and geometry must actually change.</p>
<h2>Ground, G+1 and G+2 are not plot area</h2><p>Floor count does not multiply the legal plot area. The permitted built-up area depends on local floor-area ratio, setbacks, height limits, structural checks and municipality rules. A 150 gaj plot does not automatically allow 300 or 450 gaj of construction.</p>
<h2>What to measure before opening a design</h2><ol><li>Frontage, depth and actual shape; note any non-right-angled boundary.</li><li>Which edge touches the public road, and entrance orientation.</li><li>Required setbacks, parking/vehicle movement and ventilation openings.</li><li>Ground-floor and upper-floor bedroom needs, elderly accessibility, stairs and bathroom count.</li></ol>
<p><Link href="/design-studio">Enter your plot dimensions in Home Studio →</Link> · <Link href="/calculators">Open construction calculators</Link></p>
<p><strong>Safety:</strong> Conceptual room layouts are not a licensed architect's sanctioned or structurally safe construction drawings. Verify dimensions on site before making decisions.</p>
</article><SiteFooter/></main>}