/** No dealer is not an order cancellation or confirmation.
 * Every real submitted RFQ stays visible to platform admin for manual
 * sourcing; geographic coverage is UNKNOWN, never inferred from a pincode.
 */
export type RfqQueueStatus="admin_sourcing_needed"|"dealer_reply_pending"|"offers_received"|"resolved";
export type RfqRow={id:string;status:string;category_slug:string;material_description:string;quantity:number;unit:string;city:string;pincode:string;created_at:string};
export type InviteRow={quote_request_id:string;status:string};
export type OfferRow={quote_request_id:string};
export function sourcingStatus(q:Pick<RfqRow,"id"|"status">,invites:readonly InviteRow[],offers:readonly OfferRow[]):RfqQueueStatus{
 if(["closed","cancelled","expired"].includes(q.status))return "resolved";
 if(offers.some(o=>o.quote_request_id===q.id))return "offers_received";
 if(invites.some(i=>i.quote_request_id===q.id&&["invited","viewed","responded"].includes(i.status)))return "dealer_reply_pending";
 return "admin_sourcing_needed";
}
export function attachSourcingStatus(rows:readonly RfqRow[],invites:readonly InviteRow[],offers:readonly OfferRow[]){
 return rows.map(q=>({...q,sourcing_status:sourcingStatus(q,invites,offers),fulfilment_status:"unconfirmed" as const}));
}
export function noDealerOrderRouting(args:{orderPersisted:boolean;eligibleVerifiedDealerCount:number;country:string}):"needs_order_backend"|"admin_manual_sourcing"|"dealer_dispatch_ready"{
 if(!args.orderPersisted)return "needs_order_backend";
 if(!Number.isInteger(args.eligibleVerifiedDealerCount)||args.eligibleVerifiedDealerCount<0)return "needs_order_backend";
 return args.eligibleVerifiedDealerCount===0?"admin_manual_sourcing":"dealer_dispatch_ready";
}
