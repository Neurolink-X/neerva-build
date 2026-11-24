"use client";
import {useState} from "react";
import Link from "next/link";
import Image from "next/image";

type Card={name:string;category:string;href:string;count:number;image:string|null;alt:string;detail:string};
type Section={slug:string;title:string;description:string;dealer:string;cards:Card[]};

export function BrandDirectory({sections}:{sections:Section[]}) {
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState("");
  const term=query.trim().toLowerCase();
  const filtered=sections.filter(s=>!selected||s.slug===selected).map(s=>({
    ...s,cards:s.cards.filter(c=>[s.title,c.name,c.detail].some(text=>text.toLowerCase().includes(term)))
  })).filter(s=>s.cards.length||!term||s.title.toLowerCase().includes(term));
  return <>
    <div className="br-filters"><label>Find a brand or material<input type="search" placeholder="Try Ramco, pipes or tiles" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <label>Material category<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">All materials</option>{sections.map(s=><option key={s.slug} value={s.slug}>{s.title}</option>)}</select></label></div>
    {!filtered.length&&<p role="status">No matching brands. <button onClick={()=>{setQuery("");setSelected("");}}>Clear filters</button></p>}
    {filtered.map(s=><section className="br-group" key={s.slug}><div className="br-heading"><div><h2>{s.title}</h2><p>{s.description}</p></div><Link href={s.dealer}>Dealer-listed options →</Link></div>
      <div className="br-grid">{s.cards.map(c=><Link className="br-card" key={c.href} href={c.href}>
        {c.image&&<div className="br-pack"><Image src={c.image} alt={c.alt} fill sizes="(max-width:620px) 46vw, 240px"/></div>}
        <div className="br-card-copy"><h3>{c.name}</h3><p>{c.detail}</p><strong>{c.count?`${c.count} product ${c.count===1?"reference":"references"}`:"Prepare a brand enquiry"} →</strong></div>
      </Link>)}</div></section>)}
  </>;
}
