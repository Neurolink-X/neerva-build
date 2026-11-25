
import Link from "next/link";
import {siteKnowledge} from "@/modules/home/site-knowledge";
export function AcademyFieldNotes({id}:{id:string}){
 const qs=siteKnowledge.filter(q=>q.lesson===id);if(!qs.length)return null;
 return <section className="academy-field-notes"><span className="eyebrow">FIELD NOTES · INDIA</span><h2>What to ask on a real site</h2>{qs.map(q=><article key={q.question}><h3>{q.question}</h3><p>{q.answer}</p><p lang="hi">{q.hindi}</p><p><strong>Practical check:</strong> {q.action}</p></article>)}<Link href="/build-iq#site-knowledge">Explore all construction questions →</Link></section>
}
