
import Link from "next/link";
import {workmanshipChecks} from "@/modules/home/workmanship";
export function WorkmanshipLibrary(){
 return <section className="practice-section" id="workmanship"><span className="eyebrow">FIELD SKILLS · WHAT GOOD WORK LOOKS LIKE</span><h2>Learn to recognise construction quality.</h2><p>Understand what the tradesperson is doing, what visible problems may mean and what to ask before work is covered. These checks support informed observation; they do not replace measured tolerances, testing or professional inspections.</p><div className="workmanship-grid">{workmanshipChecks.map(c=><article className="workmanship-card" id={c.id} key={c.id}><h3>{c.title}</h3><p lang="hi">{c.hi}</p><p>{c.science}</p><div className="workmanship-compare"><div><strong>What to look for</strong><p>{c.good}</p></div><div><strong>Possible warning signs</strong><p>{c.warning}</p></div></div><details><summary>On-site action and tools</summary><p>{c.action}</p><p><strong>Useful tools or records:</strong> {c.tools}</p><p lang="hi">{c.hindi}</p><Link href={"/build-iq/handbook/"+c.stage}>Understand the construction stage →</Link></details></article>)}</div></section>
}
