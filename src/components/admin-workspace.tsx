"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useState,type ReactNode} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
const groups=[["Operations",[["Overview","/admin"],["Orders","/admin/orders"],["Quotations","/admin/rfqs"],["Sourcing","/admin/fulfilment"]]],["Commerce",[["Materials","/admin/catalog"],["Pricing","/admin/pricing"],["Marketing","/admin/marketing"],["Dealers","/admin/dealers"]]],["Studio",[["Free / paid access","/admin/studio-settings"],["Payments","/admin/studio-payments"],["Design library","/admin/studio"]]],["Platform",[["Customers & roles","/admin/users"],["System health","/admin/system-health"]]]] as const;
export function AdminWorkspace({children}:{children:ReactNode}){
 const path=usePathname();const [access,setAccess]=useState<"loading"|"ready"|"denied"|"error">("loading");const [retry,setRetry]=useState(0);
 useEffect(()=>{const client=createNeervaBrowserClient();let active=true;let generation=0;
 async function check(){const id=++generation;try{if(!client)throw Error();const {data,error}=await client.auth.getUser();if(!active||id!==generation)return;if(error||!data.user){setAccess("denied");return}const role=await client.rpc("has_platform_role",{p_roles:["admin","super_admin"]});if(active&&id===generation)setAccess(role.error?"error":role.data===true?"ready":"denied")}catch{if(active&&id===generation)setAccess("error")}}
 void check();const sub=client?.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT"){generation++;setAccess("denied")}else if(event==="SIGNED_IN"){window.setTimeout(()=>{if(active)void check()},0)}});return()=>{active=false;sub?.data.subscription.unsubscribe()}
 },[retry]);
 if(access!=="ready")return <div className="admin-gate"><h1>{access==="loading"?"Checking administrator session…":access==="error"?"Permission service unavailable":"Administrator access required"}</h1><p>{access==="denied"?"Sign in using an approved admin account.":"Protected data is not displayed until the role check succeeds."}</p><Link href="/account">Account access</Link><button onClick={()=>setRetry(v=>v+1)}>Retry</button></div>;
 return <div className="admin-workspace"><header className="admin-topbar"><Link href="/admin"><strong>NEERVA BUILD</strong><small> / CONTROL CENTRE</small></Link><div><Link href="/">View store</Link><Link href="/account">Account</Link></div></header><div className="admin-workspace-grid"><aside className="admin-navigation"><nav aria-label="Admin modules">{groups.map(([title,items])=><section key={title}><strong>{title}</strong>{items.map(([label,href])=><Link href={href} key={href} aria-current={path===href?"page":undefined}>{label}</Link>)}</section>)}</nav></aside><div className="admin-module">{children}</div></div></div>;
}
