/** A key identifies an exact accepted offer and delivery address, not only an offer. */
export function isSameOfferReplay(saved:{quote_offer_id?:unknown;delivery_address?:unknown}|null|undefined,offerId:string,address:string):boolean{
 return !!saved&&saved.quote_offer_id===offerId&&typeof saved.delivery_address==="string"&&saved.delivery_address===address.trim();
}
