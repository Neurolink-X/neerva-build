/** Historical local budget comparisons, never used by basket, order or offer calculations.
 * Kanpur cement grades (Oct 24 2026): https://www.infralens.in/prices/cement/kanpur
 * Standard masonry units (Aug 2026): https://www.infralens.in/prices/masonry/kanpur
 * Fe 500D pricing uses published rates only; do not substitute another grade or unit.
 */
export function planningRate(category:string,slug:string){
 if(category==="cement"){
  if(slug.includes("ppc")||slug==="ramco-supergrade-ppc-cement")return "₹354–394 / 50 kg bag";
  if(/opc-?53|53-grade/.test(slug))return "₹394–433 / 50 kg bag";
  if(slug.includes("opc-43"))return "₹375–413 / 50 kg bag";
  if(slug.includes("psc"))return "₹364–403 / 50 kg bag";
 }
 if(category==="bricks-blocks"){
  if(slug==="generic-fly-ash-standard")return "₹6–7 / brick";
  if(slug==="red-clay-brick"||slug==="generic-clay-standard")return "₹5–7 / brick";
  if(slug==="magicrete-aac-200mm")return "₹67–103 / block";
 }
 return null;
}
