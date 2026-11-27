"use client";
import Link from "next/link";
import {useEffect,useState,useRef,type FormEvent} from "react";
import type {User} from "@supabase/supabase-js";
import {useShopCart} from "./shop-cart";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
const client=createNeervaBrowserClient();
const actions=[
 {href:"/account/orders",label:"My orders",desc:"Track requests and repeat purchases",icon:"package"},
 {href:"/account/quotes",label:"My quotations",desc:"Compare dealer offers",icon:"file"},
 {href:"/my-project#saved-materials",label:"My wishlist",desc:"Saved materials on this device",icon:"heart"},
 {href:"/account/addresses",label:"My addresses",desc:"Manage delivery locations",icon:"pin"},
 {href:"/my-project",label:"My construction project",desc:"Budget and construction checklist",icon:"home"},
 {href:"/checkout?cart=1",label:"Shopping cart",desc:"Review materials and quantities",icon:"cart"},
 {href:"/basket?view=planner",label:"Material planner",desc:"Estimate material requirements",icon:"list"},
 {href:"/account/designs",label:"Saved house designs",desc:"Open your private cloud concepts",icon:"palette"},
 {href:"/inspiration",label:"Design inspiration",desc:"Open your private mood board",icon:"palette"},
 {href:"/design-studio/visualizer",label:"Colour Studio",desc:"Try colours and download previews",icon:"palette"},
 {href:"/quotes",label:"Bulk order enquiry",desc:"Prepare an itemised request",icon:"file"},
 {href:"/returns",label:"Payments & refunds",desc:"Read cancellation and refund terms",icon:"wallet"},
 {href:"/account/activity",label:"Order & quote updates",desc:"Latest account activity",icon:"list"},
 {href:"/support",label:"Help & support",desc:"Get assistance with your request",icon:"help"},
 {href:"/privacy",label:"Privacy & security",desc:"How your information is used",icon:"shield"},
 {href:"/terms",label:"Terms of service",desc:"Platform and purchasing terms",icon:"file"},
 {href:"/account/dealer",label:"Become a dealer",desc:"Apply or track your application",icon:"home"}
] as const;
const paths:Record<string,string>={package:"M4 7l8-4 8 4v10l-8 4-8-4V7m0 0 8 4 8-4m-8 4v10",file:"M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6",heart:"M12 20S3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12Z",pin:"M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0ZM12 7v6",home:"M3 10l9-7 9 7v11h-6v-8H9v8H3Z",cart:"M3 4h3l2 12h11l2-8H7M9 20h.1M18 20h.1",list:"M5 6h14M5 12h14M5 18h14",palette:"M12 3a9 9 0 1 0 0 18c3 0 1-4 4-4h2c6-5 2-14-6-14ZM7 10h.1M12 7h.1M16 10h.1",wallet:"M3 6h18v14H3zM3 9h18M16 14h3",help:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9 9a3 3 0 1 1 4 3l-1 2M12 17h.1",shield:"M12 3l8 3v6c0 4-4 8-8 9-4-1-8-5-8-9V6zM9 12l2 2 4-4",user:"M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21v-2a8 8 0 0 1 16 0v2",settings:"M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"};
function Icon({name}:{name:string}){return <svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]??paths.file}/></svg>}
export function CustomerAccountHub({user,admin,dealer,checkoutReturn,onSignOut}:{user:User;admin:boolean;dealer:boolean;checkoutReturn:string|null;onSignOut:()=>Promise<void>}){
 const cart=useShopCart(),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(false),lock=useRef(false);
 const [locale,setLocale]=useState<"en"|"hi">("en"),[localeReady,setLocaleReady]=useState(false),[localeNotice,setLocaleNotice]=useState("");
 useEffect(()=>{let active=true;const load=async()=>{try{if(!client)return;const {data,error}=await client.from("profiles").select("preferred_locale").eq("id",user.id).maybeSingle();if(!active||error||!data)return;const value=data.preferred_locale==="hi"?"hi":"en";setLocale(value);setLocaleReady(true);try{localStorage.setItem("neerva-home-lang",value)}catch{/* private browsing */}}catch{/* preference stays unavailable */}};void load();return()=>{active=false}},[user.id]);
 async function saveLocale(value:"en"|"hi"){
  if(!client||lock.current||!localeReady)return;lock.current=true;setBusy(true);setLocaleNotice("");
  try{const auth=await client.auth.getUser();if(auth.error||auth.data.user?.id!==user.id)throw Error("Session changed");const r=await client.from("profiles").update({preferred_locale:value}).eq("id",user.id).select("preferred_locale").single();if(r.error||r.data?.preferred_locale!==value)throw Error("Not saved");setLocale(value);try{localStorage.setItem("neerva-home-lang",value)}catch{/* cloud preference remains authoritative */}setLocaleNotice(value==="hi"?"भाषा की पसंद सहेज ली गई।":"Language preference saved.");}catch{setLocaleNotice("Preference could not be saved. Please retry.");}finally{lock.current=false;setBusy(false)}
 }
 const name=typeof user.user_metadata.display_name==="string"&&user.user_metadata.display_name.trim()?user.user_metadata.display_name.trim().slice(0,100):"Your profile";
 const initials=name==="Your profile"?"":name.split(/\s+/).slice(0,2).map(s=>Array.from(s)[0]??"").join("").toUpperCase();
 async function saveProfile(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!client||lock.current)return;
  const value=String(new FormData(e.currentTarget).get("displayName")??"").trim();
  if(value.length<2||value.length>100){setError(true);setMessage("Enter a name between 2 and 100 characters.");return}
  lock.current=true;setBusy(true);setMessage("");
  try{const {data,error}=await client.auth.getUser();if(error||data.user?.id!==user.id)throw Error("Session changed");const result=await client.auth.updateUser({data:{display_name:value}});if(result.error)throw result.error;setError(false);setMessage("Profile name updated.");}catch{setError(true);setMessage("Could not update your profile. Please try again.");}finally{lock.current=false;setBusy(false)}
 }
 async function signOut(){if(lock.current)return;lock.current=true;setBusy(true);setMessage("");try{await onSignOut()}catch{setError(true);setMessage("Sign out failed. Please retry.");}finally{lock.current=false;setBusy(false)}}
 return <div className="naccount-hub">
  <section className="naccount-profile" aria-label="Customer profile"><button type="button" className="naccount-settings" aria-label="Account settings" onClick={()=>{const panel=document.getElementById("account-settings");if(panel instanceof HTMLDetailsElement){panel.open=true;panel.querySelector("input")?.focus();}}}><Icon name="settings"/></button><span className="naccount-avatar">{initials||<Icon name="user"/>}</span><h2>{name}</h2>{user.email&&<p>{user.email} · {user.email_confirmed_at?"Verified":"Awaiting verification"}</p>}{user.phone&&<p>{user.phone} · {user.phone_confirmed_at?"Verified":"Awaiting verification"}</p>}<small>Member since {new Date(user.created_at).toLocaleDateString("en-IN",{year:"numeric",month:"long",day:"numeric"})}</small></section>
  {checkoutReturn&&<Link className="button button-dark" href={checkoutReturn}>{checkoutReturn==="/account/orders"?"Return to my orders":"Continue checkout"} →</Link>}
  {(admin||dealer)&&<section className="naccount-roles" aria-label="Approved business access">{admin&&<Link href="/admin">Open admin control centre →</Link>}{dealer&&<Link href="/dealer/dashboard">Open dealer business centre →</Link>}</section>}
  <nav className="naccount-shortcuts" aria-label="Quick account actions">{actions.slice(0,3).map(a=><Link key={a.href} href={a.href} prefetch={false}><Icon name={a.icon}/><strong>{a.label}</strong></Link>)}</nav>
  <div className="naccount-sections"><section className="naccount-menu"><h3>Manage your build</h3>{actions.slice(3,12).map(a=><Link key={a.href} href={a.href} prefetch={false}><Icon name={a.icon}/><span><strong>{a.label}{a.icon==="cart"&&cart.length>0?" ("+cart.length+")":""}</strong><small>{a.desc}</small></span><span aria-hidden="true">›</span></Link>)}</section>
  <div className="naccount-secondary"><section className="naccount-menu"><h3>Account & support</h3>{actions.slice(12).map(a=><Link key={a.href} href={a.href} prefetch={false}><Icon name={a.icon}/><span><strong>{a.label}</strong><small>{a.desc}</small></span><span aria-hidden="true">›</span></Link>)}</section>
  <details className="naccount-settings-panel" id="account-settings"><summary>Account settings · edit profile</summary><form className="account-auth-form" onSubmit={saveProfile}><label>Display name<input name="displayName" defaultValue={name==="Your profile"?"":name} required minLength={2} maxLength={100} autoComplete="name"/></label><button className="button button-dark" disabled={busy}>Save profile</button></form><div className="naccount-locale"><strong>Preferred language / पसंदीदा भाषा</strong><div role="group" aria-label="Preferred language"><button type="button" className="button button-outline" disabled={busy||!localeReady} aria-pressed={locale==="en"} onClick={()=>void saveLocale("en")}>English</button><button type="button" className="button button-outline" disabled={busy||!localeReady} aria-pressed={locale==="hi"} onClick={()=>void saveLocale("hi")}>हिन्दी</button></div><p>Saved to your account; supported bilingual pages use this preference on this device after opening Account. Other pages may still use English.</p>{localeNotice&&<p role="status">{localeNotice}</p>}</div><p>For a password reset, sign out and use the existing secure email recovery option. Changing a name never changes account permissions.</p></details>
  <button className="naccount-logout" type="button" onClick={()=>void signOut()} disabled={busy}>Sign out</button>
  {message&&<p className="naccount-notice" role={error?"alert":"status"}>{message}</p>}</div></div>
 </div>;
}
