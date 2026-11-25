"use client";
import {useEffect,useState,useRef} from "react";
import {operationsRequest} from "./operations-request";
type Item={productName:string;quantity:number;unit:string};
type Branch={id:string;tenant_id:string;name:string};
type Variant={id:string;sku:string;unit:string;product?:{name?:string}|null};
type Stock={branch_id:string;variant_id:string;available_quantity:number;unit:string};
type Evidence={branches:Branch[];variants:Variant[];inventory:Stock[]};
export function StockConfirmationPanel({orderId,tenantId,lines,onDone,disabled}:{orderId:string;tenantId:string;lines:Item[];onDone:()=>Promise<void>;disabled:boolean}){
 const [enabled,setEnabled]=useState(false),[data,setData]=useState<Evidence|null>(null),[branch,setBranch]=useState(""),[mapping,setMapping]=useState<string[]>([]),[ack,setAck]=useState(false),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const lock=useRef(false);
 useEffect(()=>{let active=true;void operationsRequest<{enabled:boolean}>("/api/dealer/orders/stock").then(r=>{if(active)setEnabled(r.enabled)}).catch(()=>{});return()=>{active=false}},[]);
 async function load(){
  if(lock.current)return;lock.current=true;setBusy(true);setMessage("");
  try{setData(await operationsRequest<Evidence>("/api/dealer/inventory"));setBranch("");setMapping([]);setAck(false);}
  catch(e){setMessage(e instanceof Error?e.message:"Stock could not be loaded.");}finally{lock.current=false;setBusy(false);}
 }
 async function confirm(){
  if(lock.current||!branch||!ack||!lines.length||lines.some((_,i)=>!mapping[i]))return;
  lock.current=true;setBusy(true);setMessage("");
  try{await operationsRequest("/api/dealer/orders/stock","POST",{orderId,branchId:branch,variantIds:lines.map((_,i)=>mapping[i]),exactSkuConfirmed:true});await onDone();}
  catch(e){setMessage(e instanceof Error?e.message:"Result uncertain. Refresh orders.");}finally{lock.current=false;setBusy(false);}
 }
 if(!enabled)return null;
 return <section className="admin-box"><h3>Reserve exact stock &amp; confirm</h3><p>Match every quoted item to the actual seller SKU. Quantities are read from the accepted order; no payment is collected.</p>
 <button type="button" disabled={disabled||busy} onClick={()=>void load()}>{data?"Refresh branch inventory":"Load branch inventory"}</button>
 {data&&<><label>Branch <select value={branch} disabled={busy} onChange={e=>{setBranch(e.target.value);setMapping([]);setAck(false)}}><option value="">Choose branch</option>{data.branches.filter(b=>b.tenant_id===tenantId).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
 {branch&&lines.map((line,i)=><label key={i}>{line.productName} · {line.quantity} {line.unit}<select disabled={busy} value={mapping[i]??""} onChange={e=>{const value=e.target.value;setMapping(old=>{const next=[...old];next[i]=value;return next});setAck(false)}}><option value="">Choose exact SKU</option>{data.variants.filter(v=>v.unit===line.unit&&data.inventory.some(s=>s.branch_id===branch&&s.variant_id===v.id&&Number(s.available_quantity)>=line.quantity)).map(v=><option key={v.id} value={v.id}>{v.product?.name??v.sku} — {v.sku}</option>)}</select></label>)}
 <label><input type="checkbox" checked={ack} disabled={busy} onChange={e=>setAck(e.target.checked)}/> I verified that each SKU is exactly the material quoted, with no substitutions.</label>
 <button type="button" disabled={disabled||busy||!branch||!ack||!lines.length||lines.some((_,i)=>!mapping[i])} onClick={()=>void confirm()}>{busy?"Checking…":"Reserve and confirm order"}</button></>}
 {message&&<p role="alert">{message}</p>}</section>;
}
