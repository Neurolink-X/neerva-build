export type PackEstimateInput={netSqFt:number;coverageSqFtPerPack:number;wastagePercent:number};
export function finishPackEstimate({netSqFt,coverageSqFtPerPack,wastagePercent}:PackEstimateInput){
 if(![netSqFt,coverageSqFtPerPack,wastagePercent].every(Number.isFinite)||netSqFt<=0||netSqFt>1e8||coverageSqFtPerPack<=0||coverageSqFtPerPack>1e6||wastagePercent<0||wastagePercent>30)return null;
 const allowanceSqFt=netSqFt*wastagePercent/100,requiredSqFt=netSqFt+allowanceSqFt,packs=Math.ceil(requiredSqFt/coverageSqFtPerPack-1e-9);
 if(packs<1||packs>1e6)return null;
 return {netSqFt,allowanceSqFt,requiredSqFt,packs,orderedCoverageSqFt:packs*coverageSqFtPerPack};
}
