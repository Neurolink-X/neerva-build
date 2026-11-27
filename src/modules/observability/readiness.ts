/** Readiness evidence is intentionally not a health guarantee. Counts are RLS scoped. */
export const readinessTables={products:"products",variants:"product_variants",media:"catalog_product_media",inventory:"inventory",prices:"pricing_rules",dealers:"tenants",directOrders:"direct_orders",acceptedOrders:"orders",quotes:"quote_requests",feeVersions:"marketplace_fee_versions"} as const;
export type ReadinessKey=keyof typeof readinessTables;
export type ReadinessCounts=Record<ReadinessKey,number|null>;
export type ReadinessFinding={key:ReadinessKey;state:"unknown"|"empty"|"present";priority:"critical"|"review"|"info";count:number|null};
const required=new Set<ReadinessKey>(["products","variants","media","inventory","prices","dealers"]);
export function assessReadiness(input:Partial<ReadinessCounts>):ReadinessFinding[]{
 return (Object.keys(readinessTables) as ReadinessKey[]).map(key=>{
  const value=input[key],count=typeof value==="number"&&Number.isSafeInteger(value)&&value>=0?value:null;
  const state=count===null?"unknown":count===0?"empty":"present";
  return {key,count,state,priority:state==="present"?"info":required.has(key)?"critical":"review"};
 });
}
