"use client";
import {useState,useRef} from "react";
import {operationsRequest} from "./operations-request";
import type {ReadinessFinding} from "@/modules/observability/readiness";
const names:Record<ReadinessFinding["key"],string>={products:"Products",variants:"Variants",media:"Catalog media",inventory:"Inventory",prices:"Pricing rules",dealers:"Dealer tenants",directOrders:"Direct orders",acceptedOrders:"Accepted orders",quotes:"Quote requests",feeVersions:"Marketplace fee versions"};
type Evidence={findings:ReadinessFinding[];scope:string;checkedAt:string};
export function MarketplaceReadinessPanel(){
 const [evidence,setEvidence]=useState<Evidence|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const lock=useRef(false);
 async function check(){
  if(lock.current)return;lock.current=true;setBusy(true);setError("");setEvidence(null);
  try{setEvidence(await operationsRequest<Evidence>("/api/admin/marketplace-readiness"))}
  catch(e){setError(e instanceof Error?e.message:"Readiness check failed.")}
  finally{lock.current=false;setBusy(false);}
 }
 return <section className="admin-box"><h2>Marketplace readiness intelligence</h2><p>On-demand, read-only evidence. Empty inventory and pricing may indicate an incomplete launch; existing records do not prove availability or a successful transaction.</p><button type="button" disabled={busy} onClick={()=>void check()}>{busy?"Checking…":"Run readiness check"}</button>{error&&<p role="alert" className="admin-error">{error}</p>}{evidence&&<div aria-live="polite"><p>{evidence.scope} · {new Date(evidence.checkedAt).toLocaleString("en-IN")}</p>{evidence.findings.map(row=><article className="admin-record" key={row.key}><h3>{names[row.key]}</h3><p>{row.state==="unknown"?"Unavailable — investigate":row.state==="empty"?"No visible records":row.count+" visible records"} · {row.priority}</p></article>)}</div>}</section>;
}
