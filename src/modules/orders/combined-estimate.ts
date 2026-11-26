/** Reject partial, malformed, expired or arithmetically inconsistent estimates. */
export function validCombinedEstimate(value:unknown,unload:boolean,now:number):boolean{
 if(!value||typeof value!=="object"||Array.isArray(value)||!Number.isFinite(now))return false;
 const r=value as Record<string,unknown>;
 if(typeof r.seller!=="string"||!r.seller.trim()||r.seller.length>240)return false;
 const keys=["material_paise","fee_paise","discount_paise","freight_paise","unloading_paise","tax_paise","estimated_total_paise"] as const;
 if(!keys.every(k=>typeof r[k]==="number"&&Number.isSafeInteger(r[k])&&Number(r[k])>=0))return false;
 const [material,fee,discount,freight,unloading,tax,total]=keys.map(k=>Number(r[k]));
 if(material<=0||discount>=material||(!unload&&unloading!==0)||total<=0)return false;
 if(r.valid_to!==null&&(typeof r.valid_to!=="string"||!Number.isFinite(Date.parse(r.valid_to))||Date.parse(r.valid_to)<=now))return false;
 return BigInt(material)+BigInt(fee)+BigInt(freight)+BigInt(unloading)+BigInt(tax)-BigInt(discount)===BigInt(total);
}
