"use client";
import {useState} from "react";
import Link from "next/link";
import Image from "next/image";
import {BrandMark} from "@/components/brand-mark";

type Card={name:string;category:string;href:string;count:number;familyCount:number;image:string|null;alt:string;detail:string;rangeImage:string|null;rangeAlt:string;rangeSource:string|null};
type Section={slug:string;title:string;description:string;dealer:string;cards:Card[]};

export function BrandDirectory({sections}:{sections:Section[]}) {
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState("");
  const [failed,setFailed]=useState<string[]>([]);
  const term=query.trim().toLowerCase();
  const filtered=sections.filter(s=>!selected||s.slug===selected).map(s=>({
    ...s,cards:s.cards.filter(c=>[s.title,c.name,c.detail].some(text=>text.toLowerCase().includes(term)))
  })).filter(s=>s.cards.length||!term||s.title.toLowerCase().includes(term));
  return <>
    <div className="br-filters"><label>Find a brand or material<input type="search" placeholder="Try Ramco, pipes or tiles" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <label>Material category<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">All materials</option>{sections.map(s=><option key={s.slug} value={s.slug}>{s.title}</option>)}</select></label></div>
    <p className="br-result" aria-live="polite">{filtered.reduce((sum,s)=>sum+s.cards.length,0)} brand options · {filtered.length} material categories</p>
    {!filtered.length&&<p role="status">No matching brands. <button onClick={()=>{setQuery("");setSelected("");}}>Clear filters</button></p>}
    {filtered.map(s=><section className="br-group" key={s.slug}><div className="br-heading"><div><h2>{s.title}</h2><p>{s.description}</p></div><Link href={s.dealer}>Dealer-listed options →</Link></div>
      <div className="br-grid">{s.cards.map(c=>{const photo=[c.image,c.rangeImage].find(src=>src&&!failed.includes(src));return <article className="br-card" key={c.href}><div className="br-brand-header"><BrandMark name={c.name} small/></div><Link className="br-media-link" href={c.href} aria-label={"Explore "+c.name}>
        {photo?<div className="br-pack"><Image src={photo} alt={photo===c.image?c.alt:c.rangeAlt} fill sizes="(max-width:620px) 46vw, 240px" unoptimized={photo.startsWith("https://")} referrerPolicy="no-referrer" onError={()=>setFailed(old=>old.includes(photo)?old:[...old,photo])}/><span className="br-photo-label">{photo===c.image?"Product reference":"Range photograph"}</span></div>:<div className="br-no-photo"><small>Product photo awaiting verification</small></div>}</Link>
        <div className="br-card-copy"><h3><Link href={c.href}>{c.name}</Link></h3><p>{c.count?c.detail:"Confirm grade, pack size and local delivery terms."}</p><span className="br-stock-note">{c.count?`${c.familyCount} product ranges · ${c.count} specification options`:"Brand enquiry"} · Stock by confirmation</span>{c.rangeSource&&<a className="br-source" href={c.rangeSource} rel="noopener noreferrer" target="_blank">Range image source ↗</a>}<Link className="br-card-action" href={c.href}>{c.count?"Explore products":"Explore brand"} →</Link><Link className="br-quote-action" href={"/quotes?"+new URLSearchParams({category:c.category,material:c.name+" "+s.title})}>Request a quote</Link></div>
      </article>})}</div></section>)}
  </>;
}
