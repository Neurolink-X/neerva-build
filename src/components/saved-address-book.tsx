"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {blankAddress,parseAddress,parseSavedAddress,type AddressInput,type SavedAddress} from "@/modules/account/saved-addresses";
const client=createNeervaBrowserClient();
const columns="id,label,contact_name,phone,city,pincode,delivery_address";
function useAddressOwner(){
 const [owner,setOwner]=useState<string|null|undefined>(undefined);
 useEffect(()=>{
  if(!client){const t=setTimeout(()=>setOwner(null),0);return()=>clearTimeout(t)}
  let active=true,revision=0;
  const {data:listener}=client.auth.onAuthStateChange((_event,session)=>{revision++;if(active)setOwner(session?.user.id??null)});
  const current=revision;
  void client.auth.getSession().then(({data,error})=>{if(active&&revision===current)setOwner(error?null:data.session?.user.id??null)}).catch(()=>{if(active&&revision===current)setOwner(null)});
  return()=>{active=false;listener.subscription.unsubscribe()};
 },[]);
 return owner;
}
export function SavedAddressBook({onChoose}:{onChoose?:(address:SavedAddress,owner:string)=>void}={}){
 const owner=useAddressOwner();
 if(owner===undefined)return <p role="status">Checking account…</p>;
 if(!owner)return <p>Sign in to manage saved delivery locations. <Link href="/account">Open account →</Link></p>;
 return <AddressBook key={owner} owner={owner} onChoose={onChoose}/>;
}
function AddressBook({owner,onChoose}:{owner:string;onChoose?:(address:SavedAddress,owner:string)=>void}){
 const [rows,setRows]=useState<SavedAddress[]>([]),[status,setStatus]=useState<"loading"|"ready"|"failed">("loading"),[edit,setEdit]=useState<SavedAddress|null>(null),[draft,setDraft]=useState<AddressInput>(blankAddress),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[remove,setRemove]=useState<string|null>(null),[revision,setRevision]=useState(0);
 const lock=useRef(false);
 useEffect(()=>{
  if(!client)return;
  const abort=new AbortController();let active=true;
  void client.from("customer_saved_addresses").select(columns).eq("user_id",owner).order("created_at",{ascending:false}).limit(100).abortSignal(abort.signal).then(({data,error})=>{
   if(!active)return;
   if(error){setRows([]);setStatus("failed");return;}
   setRows((data??[]).map(parseSavedAddress).filter((a):a is SavedAddress=>Boolean(a)));setStatus("ready");
  },()=>{if(active)setStatus("failed")});
  return()=>{active=false;abort.abort()};
 },[owner,revision]);
 function reload(){setStatus("loading");setRows([]);setRevision(v=>v+1)}
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!client||lock.current||status!=="ready")return;const value=parseAddress(draft);
  if(!value){setMessage("Check the name, phone, pincode and complete address.");return}
  lock.current=true;setBusy(true);setMessage("");
  try{const {data,error}=await client.auth.getUser();if(error||data.user?.id!==owner)throw Error("Session changed");
   const result=edit?await client.from("customer_saved_addresses").update(value).eq("user_id",owner).eq("id",edit.id).select(columns).single():await client.from("customer_saved_addresses").insert({...value,user_id:owner}).select(columns).single();
   const saved=parseSavedAddress(result.data);if(result.error||!saved)throw Error("Save failed");
   setRows(old=>[saved,...old.filter(a=>a.id!==saved.id)]);setDraft(blankAddress);setEdit(null);setMessage("Address saved.");
  }catch{setMessage("Could not save the address. Check your account connection and retry.");}finally{lock.current=false;setBusy(false)}
 }
 async function deleteAddress(id:string){
  if(!client||lock.current)return;lock.current=true;setBusy(true);setMessage("");
  try{const {data,error}=await client.auth.getUser();if(error||data.user?.id!==owner)throw Error("Session changed");
   const result=await client.from("customer_saved_addresses").delete().eq("user_id",owner).eq("id",id).select("id").single();if(result.error||result.data?.id!==id)throw Error("Delete failed");
   setRows(old=>old.filter(a=>a.id!==id));if(edit?.id===id){setEdit(null);setDraft(blankAddress)}setRemove(null);setMessage("Address removed.");
  }catch{setMessage("Address could not be removed. Please retry.");}finally{lock.current=false;setBusy(false)}
 }
 if(status==="loading")return <p role="status">Loading your addresses…</p>;
 if(status==="failed")return <div role="status"><p>Saved addresses are temporarily unavailable. You can still enter delivery details manually at checkout.</p><button type="button" className="button button-outline" onClick={reload}>Retry</button></div>;
 return <div className={"naccount-addresses"+(onChoose?" naccount-addresses-picker":" naccount-addresses-manager")}>
  <div className="naccount-address-list" aria-label="Saved delivery locations">{!rows.length&&<p className="naccount-empty">No saved addresses yet. {onChoose?"Enter delivery details manually or manage your addresses.":"Add your home or construction site below."}</p>}
  {rows.map(a=><article key={a.id} className="naccount-address"><strong>{a.label}</strong><p>{a.contact_name} · {a.phone}</p><p>{a.delivery_address}, {a.city} – {a.pincode}</p>{onChoose?<button type="button" className="button button-dark" onClick={()=>onChoose(a,owner)}>Use this address</button>:<div className="naccount-address-actions"><button type="button" className="button button-outline" disabled={busy} onClick={()=>{setEdit(a);setDraft(a);setRemove(null);setMessage("")}}>Edit</button>{remove===a.id?<><button type="button" className="button button-outline" disabled={busy} onClick={()=>void deleteAddress(a.id)}>Confirm remove</button><button type="button" className="button button-outline" disabled={busy} onClick={()=>setRemove(null)}>Cancel</button></>:<button type="button" className="button button-outline" disabled={busy} onClick={()=>setRemove(a.id)}>Remove</button>}</div>}</article>)}</div>
  {onChoose?<Link href="/account/addresses" target="_blank" rel="noopener">Manage addresses in a new tab →</Link>:<form className="account-auth-form naccount-address-form" onSubmit={save}><h2>{edit?"Edit address":"Add a delivery address"}</h2><label>Address label<input required minLength={2} maxLength={40} value={draft.label} onChange={e=>setDraft(d=>({...d,label:e.target.value}))} placeholder="Home / construction site"/></label><label>Contact name<input required minLength={2} maxLength={100} autoComplete="name" value={draft.contact_name} onChange={e=>setDraft(d=>({...d,contact_name:e.target.value}))}/></label><label>Mobile<input type="tel" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="tel-national" value={draft.phone} onChange={e=>setDraft(d=>({...d,phone:e.target.value}))}/></label><label>City<input required minLength={2} maxLength={80} autoComplete="address-level2" value={draft.city} onChange={e=>setDraft(d=>({...d,city:e.target.value}))}/></label><label>Pincode<input required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} autoComplete="postal-code" value={draft.pincode} onChange={e=>setDraft(d=>({...d,pincode:e.target.value}))}/></label><label className="naccount-address-full">Complete address<textarea required minLength={12} maxLength={300} autoComplete="street-address" value={draft.delivery_address} onChange={e=>setDraft(d=>({...d,delivery_address:e.target.value}))}/></label><button className="button button-dark naccount-address-full" disabled={busy}>{busy?"Saving…":"Save address"}</button>{edit&&<button type="button" className="button button-outline naccount-address-full" disabled={busy} onClick={()=>{setEdit(null);setDraft(blankAddress)}}>Cancel edit</button>}</form>}
  {message&&<p className="naccount-notice" role="status">{message}</p>}
 </div>;
}
