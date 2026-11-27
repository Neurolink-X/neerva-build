// Local CI guardrail, not field Core Web Vitals.
export const perfTargets={lcpMs:2500,cls:0.1,ttfbMs:800};
export const perfCeilings={lcpMs:8000,cls:0.25,ttfbMs:4000};
export function assessPerformance(sample){
 const warnings=[],failures=[];
 for(const key of Object.keys(perfTargets)){
  const n=sample[key];
  if(typeof n!=="number"||!Number.isFinite(n)||n<0){warnings.push(key+" unavailable");continue}
  if(n>perfCeilings[key])failures.push(key+" "+n+" exceeds severe ceiling "+perfCeilings[key]);
  else if(n>perfTargets[key])warnings.push(key+" "+n+" exceeds target "+perfTargets[key]);
 }
 return {warnings,failures};
}

// Execute inside the browser: separate actual transfer from decoded asset sizes.
export function resourceSummary(){
 const n=performance.getEntriesByType("navigation")[0],r=performance.getEntriesByType("resource");
 const scripts=r.filter(e=>e.initiatorType==="script"||/\.js(?:\?|$)/.test(e.name));
 const images=r.filter(e=>e.initiatorType==="img"||e.name.includes("/_next/image?"));
 return {documentBytes:n?.transferSize??0,resourceBytes:r.reduce((sum,e)=>sum+e.transferSize,0),resourceCount:r.length,jsTransferBytes:scripts.reduce((sum,e)=>sum+e.transferSize,0),jsDecodedBytes:scripts.reduce((sum,e)=>sum+e.decodedBodySize,0),jsRequests:scripts.length,imageTransferBytes:images.reduce((sum,e)=>sum+e.transferSize,0),imageRequests:images.length};
}
