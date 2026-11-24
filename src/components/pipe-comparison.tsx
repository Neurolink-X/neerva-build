"use client";
import {useState} from "react";
import Link from "next/link";
import type {DemoProduct} from "@/modules/catalog/marketplace";
import {ProductPrice} from "@/components/product-price";
import {groupCatalogByPhoto} from "@/modules/catalog/media-usage";

function spec(p:DemoProduct, pattern:RegExp){return p.specifications.find(s=>pattern.test(s.label))?.value??"Confirm exact variant";}
export function PipeComparison({products}:{products:DemoProduct[]}){
 const groups=groupCatalogByPhoto(products);
 const [selected,setSelected]=useState<string[]>([]);
 const [choice,setChoice]=useState("");
 const chosen=selected.map(slug=>products.find(p=>p.slug===slug)).filter((p):p is DemoProduct=>Boolean(p));
 const available=products.filter(p=>!selected.includes(p.slug));
 const rows: [string,(p:DemoProduct)=>string][]=[["Brand",p=>p.brand],["Material / family",p=>spec(p,/^(Material|Product family|Type)$/i)],["Size",p=>spec(p,/size|diameter|requested type/i)],["Pressure / class",p=>spec(p,/pressure|schedule|class/i)],["Application / compatibility",p=>spec(p,/application|compatibility|confirm with dealer/i)]];
 return <section className="section category-detail br-compare" aria-label="Compare pipe specifications">
 <div className="br-heading"><div><span className="eyebrow">COMPARE BEFORE BUYING</span><h2>Compare up to three products</h2><p>Compare exact requested variants. Pressure, compatibility and local prices must be confirmed.</p></div></div>
 <div className="br-compare-controls"><label>Choose product or size<select value={choice} onChange={e=>setChoice(e.target.value)}><option value="">Select a product</option>{groups.map(g=><optgroup key={g.primary.slug} label={g.primary.specifications.find(s=>s.label==="Product family")?.value??g.primary.name}>{g.variants.filter(p=>available.includes(p)).map(p=><option value={p.slug} key={p.slug}>{p.brand} · {p.name}</option>)}</optgroup>)}</select></label><button className="button button-dark" type="button" disabled={!choice||selected.length>=3} onClick={()=>{if(choice&&!selected.includes(choice)&&selected.length<3){setSelected(old=>[...old,choice]);setChoice("");}}}>Add to compare</button>{selected.length>0&&<button className="button button-outline" type="button" onClick={()=>{setSelected([]);setChoice("");}}>Clear</button>}</div>
 <p role="status">{selected.length} of 3 selected</p>
 {chosen.length>0&&<div className="br-compare-scroll" tabIndex={0} role="region" aria-label="Scrollable comparison table"><table><caption>Product specifications and dealer pricing</caption><thead><tr><th scope="col">Specification</th>{chosen.map(p=><th key={p.slug} scope="col"><Link href={`/materials/${p.category}/${p.slug}`}>{p.name}</Link><button type="button" onClick={()=>setSelected(old=>old.filter(x=>x!==p.slug))} aria-label={"Remove "+p.name}>Remove</button></th>)}</tr></thead><tbody>{rows.map(([label,read])=><tr key={label}><th scope="row">{label}</th>{chosen.map(p=><td key={p.slug}>{read(p)}</td>)}</tr>)}<tr><th scope="row">Local price</th>{chosen.map(p=><td key={p.slug}><ProductPrice category={p.category} slug={p.slug} quoteOnly={p.quoteOnly}/></td>)}</tr><tr><th scope="row">Next step</th>{chosen.map(p=><td key={p.slug}><Link href={"/quotes?"+new URLSearchParams({category:p.category,material:p.name})}>Request quote →</Link></td>)}</tr></tbody></table></div>}
 </section>;
}
