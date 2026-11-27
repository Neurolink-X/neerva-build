/** Customer-facing wording, independent of backend error strings and internal state names. */
export function customerRequestError(status:number,kind:"order"|"quote"="order",code?:string){
 if(code==="QUOTE_REQUIRED")return "A selected material requires a private quote. Review your cart or request a quotation.";
 if(code==="COUPON_UNAVAILABLE")return "This coupon is unavailable. Remove it to continue.";
 if(status===401||status===403)return "Please sign in with your verified account and try again.";
 if(status===400||status===422)return "Check your material, quantity and contact or delivery details.";
 if(status===404)return "A material or request is no longer available. Review your selection.";
 if(status===409)return "Your request may have changed. Check your account before retrying.";
 if(status===429)return "Too many requests. Your details are still here; try again shortly.";
 return kind==="quote"?"We couldn't confirm your quotation request. Check My Quotations or retry the same details.":"We couldn't confirm your order request. Check My Orders or retry the same details.";
}
const orderLabels:Record<string,string>={received:"Request received",sourcing:"Arranging materials",price_ready:"Price ready for approval",pending_confirmation:"Waiting for seller confirmation",confirmed:"Order confirmed",preparing:"Preparing materials",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled",declined:"Seller unable to supply"};
export function customerOrderLabel(status:string){return orderLabels[status]??"Status unavailable — refresh to check";}
const quoteLabels:Record<string,string>={open:"Waiting for offers",quoted:"Offers available",accepted:"Offer accepted",closed:"Closed",cancelled:"Cancelled",expired:"Expired"};
export function customerQuoteLabel(status:string){return quoteLabels[status]??"Check latest status";}
