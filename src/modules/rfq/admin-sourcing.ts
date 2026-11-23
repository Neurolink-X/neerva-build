export type SourcingStatus="needs_dealer"|"checking_suppliers"|"awaiting_customer"|"supplier_unavailable"|"closed_unserviceable";
export type SourcingScope="local"|"national";
export type AdminRFQ={id:string;category_slug:string;material_description:string;quantity:number;unit:string;city:string;pincode:string;status:string;created_at:string};
export type SourcingCase={id:string;quote_request_id:string;status:SourcingStatus;scope:SourcingScope;note:string;updated_at:string};
export const sourcingStatuses:SourcingStatus[]=["needs_dealer","checking_suppliers","awaiting_customer","supplier_unavailable","closed_unserviceable"];
export function validSourcingChange(input:unknown):{caseId:string;status:SourcingStatus;scope:SourcingScope;note:string}|null{
 if(!input||typeof input!=="object"||Array.isArray(input))return null;
 const o=input as Record<string,unknown>;
 if(Object.keys(o).some(k=>!["caseId","status","scope","note"].includes(k)))return null;
 if(typeof o.caseId!=="string"||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(o.caseId))return null;
 if(!sourcingStatuses.includes(o.status as SourcingStatus))return null;
 if(o.scope!=="local"&&o.scope!=="national")return null;
 if(typeof o.note!=="string"||o.note.length>600||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(o.note))return null;
 return {caseId:o.caseId,status:o.status as SourcingStatus,scope:o.scope,note:o.note.trim()};
}
export type AdminSourcingRow=AdminRFQ&{caseId:string|null;sourcingStatus:SourcingStatus|"unknown";scope:SourcingScope|"unknown";invitationCount:number|null;humanReviewRequired:true};
export function joinSourcingQueue(rfqs:readonly AdminRFQ[],cases:readonly SourcingCase[],inviteCount:ReadonlyMap<string,number>):AdminSourcingRow[]{
 const byRFQ=new Map(cases.map(x=>[x.quote_request_id,x]));
 return rfqs.map(r=>{
  const sc=byRFQ.get(r.id);
  return {...r,caseId:sc?.id??null,sourcingStatus:sc?.status??"unknown",scope:sc?.scope??"unknown",invitationCount:inviteCount.get(r.id)??0,humanReviewRequired:true};
 });
}
