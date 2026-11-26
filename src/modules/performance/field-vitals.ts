export const GOOD_VITALS={LCP:2500,INP:200,CLS:.1} as const;
const POOR_VITALS={LCP:4000,INP:500,CLS:.25} as const;
export type VitalName=keyof typeof GOOD_VITALS;
export type VitalSample={name:VitalName;value:number;rating:"good"|"needs-improvement"|"poor";viewport:"mobile-width"|"desktop-width"};
export function toVitalSample(name:string,value:number,width:number):VitalSample|null{
 if(!Object.hasOwn(GOOD_VITALS,name)||!Number.isFinite(value)||value<0||!Number.isFinite(width)||width<=0)return null;
 const metric=name as VitalName;
 return {name:metric,value,rating:value<=GOOD_VITALS[metric]?"good":value<=POOR_VITALS[metric]?"needs-improvement":"poor",viewport:width<=760?"mobile-width":"desktop-width"};
}
