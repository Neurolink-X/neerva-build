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
