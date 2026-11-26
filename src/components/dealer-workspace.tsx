"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useState,type ReactNode} from "react";
import {operationsRequest} from "./operations-request";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
const links=[["Overview","/dealer/dashboard"],["Inventory","/dealer/inventory"],["Quotations","/dealer/quotes"],["Orders","/dealer/orders"]];
export function DealerWorkspace({children}:{children:ReactNode}){
 const path=usePathname(),[state,setState]=useState<"loading"|"ready"|"denied">("loading"),[retry,setRetry]=useState(0),[error,setError]=useState(""),[menu,setMenu]=useState("");
 useEffect(()=>{let active=true,generation=0;async function check(){const n=++generation;try{await operationsRequest("/api/dealer/overview");if(active&&n===generation)setState("ready")}catch(e){if(active&&n===generation){setError(e instanceof Error?e.message:"Dealer verification failed.");setState("denied")}}}void check();const db=createNeervaBrowserClient();const listener=db?.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT"){generation++;setState("denied")}else if(event==="SIGNED_IN"||event==="TOKEN_REFRESHED")window.setTimeout(()=>{if(active)void check()},0)});return()=>{active=false;listener?.data.subscription.unsubscribe()}},[retry]);
 if(state!=="ready")return <main className="admin-gate"><h1>{state==="loading"?"Checking dealer access…":"Dealer access unavailable"}</h1><p>{error||"Approved dealer membership is required."}</p><Link href="/account">Account access</Link><Link href="/account/dealer">Apply or track dealer application</Link><button onClick={()=>{setState("loading");setRetry(v=>v+1)}}>Retry</button></main>;
 return <div className="admin-workspace"><header className="admin-topbar"><Link href="/dealer/dashboard"><strong>NEERVA BUILD</strong><small> / DEALER CENTRE</small></Link><div><Link href="/account">Account</Link><button type="button" className="admin-menu-toggle" aria-expanded={menu===path} onClick={()=>setMenu(menu===path?"":path)}>Menu</button></div></header><div className="admin-workspace-grid"><aside className={"admin-navigation"+(menu===path?" admin-navigation-open":"")}><nav aria-label="Dealer modules"><section>{links.map(([label,href])=><Link key={href} href={href} aria-current={path===href?"page":undefined} onClick={()=>setMenu("")}>{label}</Link>)}</section></nav></aside><div className="admin-module">{children}</div></div></div>
}
