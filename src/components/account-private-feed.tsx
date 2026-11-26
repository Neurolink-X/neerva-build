"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import type {PlanModel} from "@/modules/studio/plan-model";
import {OrientedPlanDrawing} from "./oriented-plan-drawing";
import {studioDesignFromPlan} from "@/modules/studio/plan-model-adapter";
const Viewer=dynamic(()=>import("./studio-building-3d").then(m=>m.StudioBuilding3D),{ssr:false,loading:()=> <p role="status">Loading 3D preview…</p>});
const client=createNeervaBrowserClient();
type Item={id:string;title:string;detail:string;href:string;date:string};
type State={kind:"loading"|"guest"|"failed"|"ready";items:Item[];partial?:boolean};
type Project={id:string;title:string;updated_at:string;plot_width_ft:number;plot_depth_ft:number;bedrooms:number};
type Order={id:string;code:string;status:string;created_at:string;direct_order_events?:{status:string;created_at:string}[]};
type Quote={id:string;material_description:string;status:string;created_at:string;offers?:unknown[]};
const format=(value:unknown)=>String(value??"").replaceAll("_"," ");
const date=(value:string)=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleString("en-IN"):"";
async function get<T>(path:string,token:string,signal:AbortSignal):Promise<T>{
 const response=await fetch(path,{headers:{Authorization:"Bearer "+token},cache:"no-store",signal});if(!response.ok)throw Error("Private data unavailable");return response.json() as Promise<T>;
}
export function AccountPrivateFeed({mode}:{mode:"designs"|"activity"}){
 const [owner,setOwner]=useState<string|null|undefined>(undefined);
 useEffect(()=>{if(!client){const t=setTimeout(()=>setOwner(null),0);return()=>clearTimeout(t)}let active=true,revision=0;
 const {data:listener}=client.auth.onAuthStateChange((_e,s)=>{revision++;if(active)setOwner(s?.user.id??null)});const initial=revision;
 void client.auth.getSession().then(({data,error})=>{if(active&&revision===initial)setOwner(error?null:data.session?.user.id??null)}).catch(()=>{if(active&&revision===initial)setOwner(null)});
 return()=>{active=false;listener.subscription.unsubscribe()}},[]);
 if(owner===undefined)return <p role="status">Checking account…</p>;
 if(!owner)return <p>Sign in to view your private account information. <Link href="/account">Open account →</Link></p>;
 return <PrivateFeed key={owner+mode} owner={owner} mode={mode}/>;
}
function PrivateFeed({owner,mode}:{owner:string;mode:"designs"|"activity"}){
 const [state,setState]=useState<State>({kind:"loading",items:[]}),[revision,setRevision]=useState(0);
 const [selection,setSelection]=useState<{id:string;title:string;plan:PlanModel}|null>(null),[opening,setOpening]=useState<string|null>(null),[notice,setNotice]=useState(""),[floor,setFloor]=useState(0),[three,setThree]=useState(false);
 useEffect(()=>{const abort=new AbortController();let active=true;
 void (async()=>{try{const session=(await client?.auth.getSession())?.data.session;if(!session||session.user.id!==owner){if(active)setState({kind:"guest",items:[]});return}
 if(mode==="designs"){const data=await get<{projects:Project[]}>("/api/studio/projects",session.access_token,abort.signal);
 if(active)setState({kind:"ready",items:data.projects.map(p=>({id:p.id,title:p.title,detail:p.plot_width_ft+" × "+p.plot_depth_ft+" ft · "+p.bedrooms+" BHK",href:"",date:p.updated_at}))});return;}
 const [orders,quotes]=await Promise.allSettled([get<{orders:Order[]}>("/api/direct-orders?page=1",session.access_token,abort.signal),get<{requests:Quote[]}>("/api/customer/quotes",session.access_token,abort.signal)]);
 const items:Item[]=[];
 if(orders.status==="fulfilled")for(const o of orders.value.orders){const latest=[...(o.direct_order_events??[])].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0];items.push({id:"order-"+o.id,title:"Order "+o.code,detail:format(latest?.status??o.status),href:"/account/orders",date:latest?.created_at??o.created_at});}
 if(quotes.status==="fulfilled")for(const q of quotes.value.requests)items.push({id:"quote-"+q.id,title:q.material_description,detail:format(q.status)+" · "+(q.offers?.length??0)+" dealer offers",href:"/account/quotes",date:q.created_at});
 if(active)setState({kind:orders.status==="rejected"&&quotes.status==="rejected"?"failed":"ready",items:items.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,50),partial:orders.status==="rejected"||quotes.status==="rejected"});
 }catch{if(active)setState({kind:"failed",items:[]})}})();
 return()=>{active=false;abort.abort()};},[owner,mode,revision]);
 async function open(id:string){if(opening)return;setOpening(id);setNotice("");setSelection(null);setFloor(0);setThree(false);
 try{const session=(await client?.auth.getSession())?.data.session;if(!session||session.user.id!==owner)throw Error("Session changed");
 const result=await get<{project:{id:string;title:string;plan:PlanModel}}>("/api/studio/projects/"+encodeURIComponent(id),session.access_token,AbortSignal.timeout(15000));setSelection(result.project);
 }catch{setNotice("Could not reopen this saved concept. Try again.");}finally{setOpening(null)}}
 return <div className="naccount-private-feed">
 <button type="button" className="button button-outline" disabled={state.kind==="loading"} onClick={()=>{setState({kind:"loading",items:[]});setRevision(x=>x+1)}}>Refresh {mode==="designs"?"saved designs":"updates"}</button>
 {state.kind==="loading"&&<p role="status">Loading…</p>}{state.kind==="failed"&&<p role="alert">Account information is temporarily unavailable. Retry.</p>}{state.kind==="guest"&&<Link href="/account">Sign in again →</Link>}{state.kind==="ready"&&!state.items.length&&<p>No {mode==="designs"?"saved concepts":"recent updates"} yet.</p>}{state.partial&&state.kind==="ready"&&<p role="status">Some account updates are unavailable.</p>}
 <div className="naccount-feed-grid">{state.items.map(item=><article key={item.id} className="naccount-address"><strong>{item.title}</strong><p>{item.detail}</p><small>{date(item.date)}</small>{mode==="designs"?<button type="button" className="button button-outline" disabled={Boolean(opening)} onClick={()=>void open(item.id)}>{opening===item.id?"Opening…":"Open saved concept"}</button>:<Link href={item.href} className="button button-outline">View details →</Link>}</article>)}</div>
 {notice&&<p role="alert">{notice}</p>}{selection&&<section className="naccount-saved-plan"><h2>{selection.title}</h2><p>Saved geometry snapshot · concept only, not an approved construction drawing.</p><div className="naccount-address-actions">{Array.from({length:selection.plan.floors},(_,i)=><button key={i} type="button" aria-pressed={floor===i} onClick={()=>setFloor(i)} className="button button-outline">{i===0?"Ground floor":"Floor "+i}</button>)}</div><OrientedPlanDrawing plan={selection.plan} floor={floor}/>{three?<Viewer design={studioDesignFromPlan(selection.plan)} colour={selection.plan.facade.main} planModel={selection.plan} selectedFloor={floor}/>:<button type="button" className="button button-dark" onClick={()=>setThree(true)}>Load matching 3D</button>}</section>}
 </div>;
}
