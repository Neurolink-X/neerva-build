
"use client";
import {useState} from "react";
import Link from "next/link";
import {searchKnowledge,knowledgeSources} from "@/modules/home/site-knowledge";
export function SiteKnowledge(){
 const [query,setQuery]=useState(""),[hi,setHi]=useState(false);
 const results=searchKnowledge(query);
 return <section className="site-knowledge" id="site-knowledge"><span className="eyebrow">THE INDIAN CONSTRUCTION ANSWER BOOK</span><h2>Ask better questions before you build.</h2><p>Search practical questions in Hindi or English. Each answer has a site action and a deeper lesson.</p><div className="build-tabs"><button type="button" aria-pressed={!hi} onClick={()=>setHi(false)}>English</button><button type="button" aria-pressed={hi} onClick={()=>setHi(true)}>हिंदी</button></div><label className="knowledge-search">Search construction questions<input type="search" placeholder="e.g. cement, नींव, AAC, budget" value={query} maxLength={100} onChange={e=>setQuery(e.target.value)}/></label><p role="status">{results.length} questions</p><div className="knowledge-answers">{results.map(q=><details key={q.question}><summary>{hi?q.hi:q.question}</summary><p lang={hi?"hi":"en"}>{hi?q.hindi:q.answer}</p>{hi&&<p>{q.answer}</p>}<p><strong>Site action:</strong> {q.action}</p><Link href={"/build-iq/"+q.lesson}>Explore full lesson →</Link></details>)}</div>{!results.length&&<p>Try fewer keywords or another spelling (e.g. steel, सरिया).</p>}<details className="knowledge-sources"><summary>Reference standards and professional review</summary><p>These are educational summaries, not certified engineering advice. Check the applicable standard, amendments, local approvals and project specification.</p>{knowledgeSources.map(s=><p key={s.href}><a href={s.href}>{s.label}</a></p>)}</details></section>
}
