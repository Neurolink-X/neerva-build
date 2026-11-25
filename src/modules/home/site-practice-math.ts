
const valid=(n:number,min=0,max=1e9)=>Number.isFinite(n)&&n>=min&&n<=max;
const paise=(n:number)=>Math.round(n*100);
export function deliveredQuote(x:{quantity:number;rate:number;freight:number;unloading:number;other:number;discount:number;taxAmount:number}){
 if(!valid(x.quantity,.001,1e6)||!valid(x.rate,0,1e6)||![x.freight,x.unloading,x.other,x.discount,x.taxAmount].every(n=>valid(n,0,1e8)))return null;
 const base=paise(x.quantity*x.rate), extras=paise(x.freight)+paise(x.unloading)+paise(x.other), discount=paise(x.discount);
 if(discount>base+extras)return null;
 const total=(base+extras-discount+paise(x.taxAmount))/100;
 return {base:base/100,total,unitCost:total/x.quantity};
}
export function reconcileDelivery(ordered:number,delivered:number,rejected:number){
 if(!valid(ordered,1,1e8)||!valid(delivered,0,1e8)||!valid(rejected,0,delivered)||![ordered,delivered,rejected].every(Number.isInteger))return null;
 const accepted=delivered-rejected;
 return {accepted,missing:Math.max(0,ordered-delivered),rejected,shortfall:Math.max(0,ordered-accepted),overDelivered:Math.max(0,delivered-ordered),surplusAccepted:Math.max(0,accepted-ordered)};
}
