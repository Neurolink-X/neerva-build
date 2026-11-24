"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {categoryUnits} from "@/modules/catalog/category-units";
type Status="draft"|"published"|"archived";
type Category={id:string;slug:string;name_en:string;name_hi:string;pricing_mode:"public"|"quote_only";status:Status};
type Brand={id:string;name:string;slug:string;status:Status;authorized_source:string|null};
type Variant={id:string;sku:string;unit:string;status:Status};
type Product={id:string;slug:string;name:string;description:string;status:Status;category:Category|null;brand:Brand|null;variants:Variant[]};
type Data={categories:Category[];brands:Brand[];products:Product[]};
type Kind="category"|"brand"|"product"|"variant";
const client=createNeervaBrowserClient();
async function api(method="GET",body?:unknown){
 const session=await client?.auth.getSession();const token=session?.data.session?.access_token;
 if(!token)throw Error("Sign in with an approved administrator account.");
 const res=await fetch("/api/admin/catalog",{method,cache:"no-store",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await res.json().catch(()=>({error:"Invalid server response."}));
 if(!res.ok)throw Error([data.error,...(Array.isArray(data.fields)?data.fields.map((x:{field:string;message:string})=>x.field+": "+x.message):[])].filter(Boolean).join(" · ")||"Catalog request failed.");
 return data;
}
const states:Status[]=["draft","published","archived"];
function StateSelect({id,kind,status,busy,change}:{id:string;kind:Kind;status:Status;busy:boolean;change:(payload:Record<string,unknown>)=>void}){
 return <label className="admin-field">Publication<select aria-label={kind+" publication status"} disabled={busy} value={status} onChange={e=>change({kind,id,status:e.target.value})}>{states.map(s=><option key={s} value={s}>{s==="archived"?"Archived (hidden)":s}</option>)}</select></label>;
}
export function CatalogAdminPanel(){
 const [data,setData]=useState<Data|null>(null);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [kind,setKind]=useState<Kind>("product"),[query,setQuery]=useState(""),[filter,setFilter]=useState("all"),[parent,setParent]=useState("");
 const [edit,setEdit]=useState<Product|null>(null);
 const lock=useRef(false);
 const load=useCallback(async()=>{setLoading(true);setError("");try{setData(await api() as Data)}catch(e){setData(null);setError(e instanceof Error?e.message:"Unable to load catalog.")}finally{setLoading(false)}},[]);
 useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);
 async function mutate(method:string,payload:Record<string,unknown>){
  if(lock.current)return false;lock.current=true;setBusy(true);setError("");setNotice("");
  try{await api(method,payload);await load();setNotice("Saved. Review the latest catalog records.");return true}
  catch(e){setError(e instanceof Error?e.message:"Save failed.");return false}
  finally{lock.current=false;setBusy(false)}
 }
 function change(payload:Record<string,unknown>){if(payload.status==="archived"&&!window.confirm("Archive this record? It will be hidden from active listings."))return;void mutate("PATCH",payload)}
 async function create(e:FormEvent<HTMLFormElement>){
  e.preventDefault();const form=e.currentTarget;const f=new FormData(form);const t=(key:string)=>String(f.get(key)??"").trim();
  let payload:Record<string,unknown>={action:"create",kind};
  if(kind==="category")payload={...payload,slug:t("slug"),nameEn:t("nameEn"),nameHi:t("nameHi"),pricingMode:t("pricingMode")};
  if(kind==="brand")payload={...payload,slug:t("slug"),name:t("name"),...(t("source")?{authorizedSource:t("source")}:{})};
  if(kind==="product")payload={...payload,slug:t("slug"),name:t("name"),description:t("description"),categoryId:t("categoryId"),...(t("brandId")?{brandId:t("brandId")}:{})};
  if(kind==="variant")payload={...payload,productId:t("productId"),sku:t("sku"),unit:t("unit")};
  if(await mutate("POST",payload)){form.reset();setParent("")}
 }
 const products=data?.products??[];
 const visible=products.filter(p=>(filter==="all"||p.status===filter)&&[p.name,p.slug,p.brand?.name,p.category?.name_en,...p.variants.map(v=>v.sku)].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
 const parentProduct=products.find(p=>p.id===parent);
 return <div className="admin-catalog-workbench">
 <section className="admin-box"><div className="admin-inline"><div><h2>Material inventory</h2><p>Manage actual database records. Archived items retain their references.</p></div><button type="button" disabled={loading||busy} onClick={()=>void load()}>{loading?"Loading…":"Refresh"}</button></div>
 {error&&<p role="alert" className="admin-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {data&&<div className="admin-metrics">{[["Products",data.products.length],["Categories",data.categories.length],["Brands",data.brands.length]].map(([label,n])=><div key={label}><small>{label} loaded</small><strong>{n}</strong></div>)}</div>}
 {!loading&&data&&products.length===0&&<p className="admin-empty">No database products yet. Public reference catalog entries are not automatically editable stock. Add real products and variants below.</p>}
 </section>
 {data&&<><section className="admin-box"><h2>Add a catalog record</h2><div className="admin-tabs" aria-label="Record type">{(["product","variant","brand","category"] as const).map(k=><button key={k} type="button" aria-pressed={kind===k} disabled={busy} onClick={()=>{setKind(k);setParent("")}}>{k}</button>)}</div>
 <form key={kind} className="catalog-admin-form" onSubmit={create}>
 {kind!=="variant"&&<label>URL identifier<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={90} placeholder="cement-50kg"/></label>}
 {kind==="category"?<><label>English name<input name="nameEn" required minLength={2} maxLength={120}/></label><label>Hindi name<input name="nameHi" required minLength={2} maxLength={120}/></label><label>Pricing mode<select name="pricingMode"><option value="public">Public price</option><option value="quote_only">Quote only</option></select></label></>:null}
 {kind==="brand"?<><label>Brand name<input name="name" required minLength={2} maxLength={120}/></label><label>Manufacturer reference (required before publication)<input name="source" type="url" maxLength={500}/></label></>:null}
 {kind==="product"?<><label>Product name<input name="name" required minLength={2} maxLength={180}/></label><label>Category<select name="categoryId" required defaultValue=""><option value="" disabled>Choose category</option>{data.categories.map(c=><option key={c.id} value={c.id}>{c.name_en}</option>)}</select></label><label>Brand<select name="brandId"><option value="">No brand</option>{data.brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label className="wide-field">Description<textarea name="description" maxLength={2000} rows={4}/></label></>:null}
 {kind==="variant"?<><label>Parent product<select name="productId" required value={parent} onChange={e=>setParent(e.target.value)}><option value="">Choose product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>SKU<input name="sku" required minLength={2} maxLength={100}/></label><label>Unit<select name="unit" key={parent} required defaultValue=""><option value="">Choose unit</option>{categoryUnits(parentProduct?.category?.slug??"").map(u=><option key={u}>{u}</option>)}</select></label></>:null}
 <button disabled={busy||loading} className="wide-field">{busy?"Saving…":"Create draft "+kind}</button>
 </form><p>New records begin as drafts. Publish a verified category, brand and product before selling its variant.</p></section>
 <section className="admin-box"><h2>Products and variants</h2><div className="admin-inline"><label>Search<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, brand or SKU"/></label><label>Status<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All</option>{states.map(s=><option key={s}>{s}</option>)}</select></label></div>
 <p>{visible.length} of {products.length} loaded products</p>{visible.map(p=><article className="admin-record" key={p.id}><div><h3>{p.name}</h3><p>{p.brand?.name??"Unbranded"} · {p.category?.name_en??"No category"}</p><p>{p.description}</p></div><StateSelect id={p.id} kind="product" status={p.status} busy={busy} change={change}/><button type="button" onClick={()=>setEdit(p)}>Edit description</button><button type="button" onClick={()=>{setKind("variant");setParent(p.id);window.scrollTo({top:0,behavior:"smooth"})}}>Add SKU</button>{p.variants.map(v=><div className="admin-record" key={v.id}><strong>{v.sku} · {v.unit}</strong><StateSelect id={v.id} kind="variant" status={v.status} busy={busy} change={change}/></div>)}</article>)}
 {edit&&<form className="catalog-admin-form admin-record" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(await mutate("PATCH",{kind:"product",id:edit.id,status:edit.status,description:String(f.get("description")??"")}))setEdit(null)}}><label className="wide-field">Edit {edit.name}<textarea name="description" defaultValue={edit.description} maxLength={2000}/></label><button disabled={busy}>Save changes</button><button type="button" onClick={()=>setEdit(null)}>Cancel</button></form>}
 </section><section className="admin-box"><h2>Brands and categories</h2>{data.categories.map(c=><div className="admin-record" key={c.id}><strong>{c.name_en} · {c.pricing_mode}</strong><StateSelect id={c.id} kind="category" status={c.status} busy={busy} change={change}/></div>)}{data.brands.map(b=><div className="admin-record" key={b.id}><strong>{b.name}</strong><StateSelect id={b.id} kind="brand" status={b.status} busy={busy} change={change}/>{!b.authorized_source&&<form className="catalog-admin-form" onSubmit={e=>{e.preventDefault();void mutate("PATCH",{kind:"brand",id:b.id,status:b.status,authorizedSource:String(new FormData(e.currentTarget).get("source"))})}}><label>Manufacturer reference<input name="source" type="url" required maxLength={500}/></label><button disabled={busy}>Save reference</button></form>}</div>)}</section></>}
 </div>;
}
