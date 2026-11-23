"use client";
import {useState} from "react";
export type InvoiceLine={productName:string;quantity:number;unit:string;lineTotalPaise:number};
export type VerifiedInvoice={
 code:string;business_name:string;created_at:string;status:string;
 gstin?:string|null;total_paise:number;tax_paise:number;freight_paise:number;unloading_paise:number;
 line_items:InvoiceLine[];invoice_number?:string|null;
};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(paise/100);
export function OrderInvoice({order}:{order:VerifiedInvoice}){
 const [expanded,setExpanded]=useState(false);
 const verified=Boolean(order.invoice_number)&&["delivered","completed","paid"].includes(order.status.toLowerCase());
 return <section className="neerva-invoice" style={{border:"1px solid #dbe3db",borderRadius:12,padding:16,marginTop:14,background:"#fff"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
   <div><strong>{verified?"GST invoice":"Order cost breakdown"}</strong><p>{order.code} · {order.business_name}</p></div>
   <button className="button button-outline" type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>{expanded?"Hide":"View"} details</button>
  </div>
  {expanded&&<div>
   <p>Amounts below are from the order service, not estimated website catalog prices.</p>
   <table style={{width:"100%",textAlign:"left"}}><thead><tr><th>Item</th><th>Quantity</th><th>Line total</th></tr></thead><tbody>
    {order.line_items.map((line,i)=><tr key={i}><td>{line.productName}</td><td>{line.quantity} {line.unit}</td><td>{money(line.lineTotalPaise)}</td></tr>)}
   </tbody></table>
   <p>Tax: {money(order.tax_paise)} · Freight: {money(order.freight_paise)} · Unloading: {money(order.unloading_paise)}</p>
   <strong>Total: {money(order.total_paise)}</strong>
   {verified?<div><p>Invoice number: {order.invoice_number}{order.gstin?" · GSTIN: "+order.gstin:""}</p><button className="button button-outline" type="button" onClick={()=>window.print()}>Print verified invoice</button></div>:<p>No GST invoice is issued by this view until the order service supplies a verified invoice number and completed status.</p>}
  </div>}
 </section>;
}
