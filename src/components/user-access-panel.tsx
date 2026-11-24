"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type Profile={id:string;display_name:string;preferred_locale:string;created_at:string};
type Grant={user_id:string;role:string;granted_at:string};
type Data={users:Profile[];roles:Grant[];canManageRoles:boolean;currentUserId:string};
const staff=["support","finance","admin"] as const;
async function request(method="GET",body?:unknown){
 const token=(await createNeervaBrowserClient()?.auth.getSession())?.data.session?.access_token;
 if(!token)throw Error("Sign in again.");
 const r=await fetch("/api/admin/users",{method,cache:"no-store",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
 const d=await r.json();if(!r.ok)throw Error(d.error??"Account request failed.");return d;
}
export function UserAccessPanel(){
 const [data,setData]=useState<Data|null>(null),[query,setQuery]=useState(""),[filter,setFilter]=useState("all"),[revision,setRevision]=useState(0),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const lock=useRef(false);
 useEffect(()=>{let active=true;void request().then(d=>{if(active){setData(d);setError("")}}).catch(e=>{if(active){setData(null);setError(String(e.message))}}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[revision]);
 async function change(e:FormEvent<HTMLFormElement>,user:Profile){
  e.preventDefault();if(lock.current)return;const f=new FormData(e.currentTarget),role=String(f.get("role")),action=String(f.get("action")),reason=String(f.get("reason"));
  if(!window.confirm(action+" "+role+" access for "+user.display_name+"?"))return;
  lock.current=true;setBusy(true);setError("");setNotice("");
  try{const d=await request("POST",{userId:user.id,role,action,reason});setNotice(d.changed?"Permission changed and audited.":"No change needed.");setLoading(true);setRevision(v=>v+1)}
  catch(e){setError(e instanceof Error?e.message:"Permission change failed.")}finally{lock.current=false;setBusy(false)}
 }
 const rows=(data?.users??[]).filter(u=>{const roles=data?.roles.filter(r=>r.user_id===u.id).map(r=>r.role)??[];return (filter==="all"||filter==="customer"&&!roles.some(r=>r!=="customer")||roles.includes(filter))&&[u.display_name,u.id,...roles].join(" ").toLowerCase().includes(query.toLowerCase())});
 return <section className="admin-box"><h2>Customer and staff directory</h2><p>Search the latest loaded account profiles. Only super administrators can grant or revoke support, finance or admin roles. Owner and self-access are protected.</p><div className="admin-inline"><label>Search<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, UUID or role"/></label><label>Role<select value={filter} onChange={e=>setFilter(e.target.value)}>{["all","customer","dealer","support","finance","admin","super_admin"].map(r=><option key={r}>{r}</option>)}</select></label><button disabled={loading||busy} onClick={()=>{setLoading(true);setRevision(v=>v+1)}}>Refresh</button></div>{error&&<p role="alert" className="admin-error">{error}</p>}{notice&&<p role="status">{notice}</p>}{loading?<p>Loading protected accounts…</p>:data&&<><p>{rows.length} of {data.users.length} loaded profiles</p>{rows.map(u=>{const roles=data.roles.filter(r=>r.user_id===u.id);return <article className="admin-record" key={u.id}><h3>{u.display_name}</h3><p>{roles.map(r=>r.role).join(" · ")||"No staff grants"} · {u.preferred_locale}</p><small>{u.id} · Joined {new Date(u.created_at).toLocaleDateString("en-IN")}</small>{data.canManageRoles&&u.id!==data.currentUserId&&!roles.some(r=>r.role==="super_admin")&&<form className="catalog-admin-form" onSubmit={e=>void change(e,u)}><label>Staff role<select name="role">{staff.map(r=><option key={r}>{r}</option>)}</select></label><label>Action<select name="action"><option value="grant">Grant</option><option value="revoke">Revoke</option></select></label><label className="wide-field">Reason<textarea required name="reason" minLength={10} maxLength={500}/></label><button disabled={busy||loading}>Confirm permission change</button></form>}</article>})}{!rows.length&&<p>No matching profiles.</p>}</>}</section>
}
