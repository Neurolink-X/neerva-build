"use client";
import {SecureOperationsList} from "./secure-operations-list";
export function AdminRfqPanel(){
 return <div style={{display:"grid",gap:22}}>
  <section style={{background:"#edf4eb",border:"1px solid #cce0c9",padding:18,borderRadius:14,maxWidth:1100}}>
   <h2 style={{fontSize:22,margin:"0 0 10px"}}>Nationwide procurement fallback</h2>
   <p style={{fontSize:15,lineHeight:1.65}}>If a real customer enquiry has no eligible approved dealer, it remains visible in the admin sourcing queue for manual follow-up. There is no guaranteed India-wide dealer coverage, instant dispatch or 60-minute delivery claim. Confirm the supplier, final product SKU, total delivered cost and availability before accepting an order.</p>
   <p style={{fontSize:13}}>This list contains real requests only; no customer contact information is exposed in the table.</p>
  </section>
  <SecureOperationsList endpoint="/api/admin/rfqs" title="Customer quotation & sourcing queue"
   description="No dealer offers → admin sourcing needed. Verified dealer invited → awaiting response. A request is not an order, invoice or delivery."
   arrays={[{key:"requests",label:"Verified customer RFQs",fields:["category_slug","material_description","quantity","unit","city","pincode","sourcing_status","fulfilment_status","created_at"]}]}/>
  <SecureOperationsList endpoint="/api/admin/orders" title="Confirmed orders — backend status"
   description="Read only from the real protected order service. If the order backend is not configured, no orders are invented. Implement /v1/orders/admin with persistent manual-sourcing status and admin RBAC before enabling checkout."
   arrays={[{key:"orders",label:"Persisted orders",fields:["code","city","pincode","status","fulfilment_status","created_at"]}]}/>
 </div>;
}
