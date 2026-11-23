/** Parse URL prefill as untrusted data. Never treat search params as a
 * saved request, a checked price, a payment, or verified supplier coverage.
 */
export function cleanQuotePrefill(q:{city?:unknown;material?:unknown;quantity?:unknown;pincode?:unknown}){
 const city=typeof q.city==="string"&&/^[\p{L} .'-]{2,60}$/u.test(q.city.trim())?q.city.trim():"Kanpur";
 const material=typeof q.material==="string"?q.material.replace(/[\u0000-\u001f]/g," ").trim().slice(0,240):"";
 const n=typeof q.quantity==="string"?Number(q.quantity):NaN;
 const quantity=Number.isFinite(n)&&n>0&&n<=1_000_000?String(n):"";
 const pincode=typeof q.pincode==="string"&&/^[1-9][0-9]{5}$/.test(q.pincode)?q.pincode:"";
 return {city,material,quantity,pincode};
}
