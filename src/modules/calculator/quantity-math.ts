/** Shared pure arithmetic. Input policy remains with the specific calculator. */
export function validRange(n:number,min:number,max:number):boolean{
 return Number.isFinite(n)&&n>=min&&n<=max;
}
export function parseMeasurement(raw:string):number{
 return raw.trim()===""?NaN:Number(raw);
}
export function withAllowance(quantity:number,percent:number):number{
 return quantity*(1+percent/100);
}
export function areaCost(area:number,rate:number,percent:number){
 const subtotal=area*rate;
 return {subtotal,total:withAllowance(subtotal,percent)};
}
/** Optional tariff uses the same multiply-before-convert order as the original cost estimate. */
export function energyKwh(watts:number,hours:number,days:number,tariff=1):number{
 return watts*hours*days*tariff/1000;
}
