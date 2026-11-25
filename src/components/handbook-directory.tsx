
"use client";
import Link from "next/link";
import {useState} from "react";
type Entry={id:string;title:string;hi:string;kicker:string;keywords:string;intro:string;introHi:string};
export function HandbookDirectory({entries}:{entries:readonly Entry[]}){
 const [query,setQuery]=useState("");const words=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean).slice(0,12);const visible=entries.filter(c=>words.every(w=>[c.title,c.hi,c.keywords,c.intro,c.introHi].join(" ").toLocaleLowerCase().includes(w)));
 return <section className="handbook-directory" id="handbook"><span className="eyebrow">THE CONSTRUCTION HANDBOOK · INDIA</span><h2>Find your stage. Understand the whole system.</h2><p>Start from a project stage or search a material, skill or site problem. Every field guide has principles, worked examples, risks, checklists and related tools.</p><label className="knowledge-search">Search the construction handbook<input type="search" maxLength={100} value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. foundation, waterproofing, सरिया"/></label><p role="status">{visible.length} field guides</p><div className="handbook-grid">{visible.map(c=><article key={c.id}><span className="eyebrow">{c.kicker}</span><h3><Link href={"/build-iq/handbook/"+c.id}>{c.title}</Link></h3><p lang="hi">{c.hi}</p><p>{c.intro}</p><Link href={"/build-iq/handbook/"+c.id}>Open field guide →</Link></article>)}</div>{!visible.length&&<p>No matching field guide. Try a shorter term.</p>}</section>
}
