/** Public promotional terms must be backed by an active, published price, not a guessed discount. */
export type OfferValidity={
 basePaise:number;offerPaise:number;startsAt:string;endsAt:string;
 priceAmountPaise:number;priceStatus:string;visibility:string;
 priceStartsAt:string;priceEndsAt:string|null;
};
export function hasRealActiveDiscount(value:OfferValidity,nowMs:number):boolean{
 const a=value;
 if(!Number.isFinite(nowMs)||!Number.isSafeInteger(a.basePaise)||!Number.isSafeInteger(a.offerPaise)||
    !Number.isSafeInteger(a.priceAmountPaise)||a.priceStatus!=="published"||
    a.visibility!=="public"||a.basePaise<=0||a.offerPaise<=0||
    a.offerPaise>=a.basePaise||a.priceAmountPaise!==a.basePaise)return false;
 const start=Date.parse(a.startsAt),end=Date.parse(a.endsAt),from=Date.parse(a.priceStartsAt),
  to=a.priceEndsAt?Date.parse(a.priceEndsAt):Number.POSITIVE_INFINITY;
 return [start,end,from].every(Number.isFinite)&&(!a.priceEndsAt||Number.isFinite(to))&&
   start>=from&&end<=to&&end>start&&start<=nowMs&&end>nowMs&&from<=nowMs&&to>nowMs;
}
