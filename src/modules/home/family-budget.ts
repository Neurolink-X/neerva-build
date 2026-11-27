export type BudgetInput={builtArea:number;rate:number;extras:number;reservePercent:number;budget:number};
export function familyBudget(i:BudgetInput){
 if(!Number.isFinite(i.builtArea)||i.builtArea<1||i.builtArea>150000||!Number.isFinite(i.rate)||i.rate<1||i.rate>100000||!Number.isFinite(i.extras)||i.extras<0||i.extras>1e9||!Number.isFinite(i.reservePercent)||i.reservePercent<0||i.reservePercent>50||!Number.isFinite(i.budget)||i.budget<0||i.budget>1e9)return null;
 const construction=Math.round(i.builtArea*i.rate),base=construction+Math.round(i.extras),reserve=Math.round(base*i.reservePercent/100),total=base+reserve;
 if(!Number.isSafeInteger(total)||total>1e9)return null;
 return {construction,extras:Math.round(i.extras),reserve,total,balance:i.budget?Math.round(i.budget)-total:null};
}
