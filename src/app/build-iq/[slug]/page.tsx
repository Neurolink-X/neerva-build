import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {AcademyFieldNotes} from "@/components/academy-field-notes";
import {AcademyLessonVisual} from "@/components/academy-lesson-visual";
import {AcademyPractice} from "@/components/academy-progress";
import {chapters} from "@/modules/home/handbook";
import {lessons} from "@/modules/home/academy";
import "../academy.css";
type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){return lessons.map(l=>({slug:l.id}))}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params,l=lessons.find(x=>x.id===slug);return l?{title:l.title+" | Neerva Academy",description:l.summary,alternates:{canonical:"/build-iq/"+l.id}}:{}}
export default async function Lesson({params}:Props){const {slug}=await params;const i=lessons.findIndex(l=>l.id===slug);if(i<0)notFound();const l=lessons[i],next=lessons[i+1];return <main className="catalog-page"><SiteHeader/><article className="academy academy-lesson"><Link href="/build-iq">← Neerva Academy</Link><header className="academy-hero"><span className="eyebrow">{l.topic} · {l.minutes} MIN · LESSON {i+1}</span><h1>{l.title}</h1><p lang="hi">{l.hi}</p><p>{l.summary}</p></header><AcademyLessonVisual id={l.id}/>{l.concepts.map((c,n)=><section key={c.title} className="academy-concept"><span>0{n+1}</span><div><h2>{c.title}</h2><p>{c.text}</p></div></section>)}<section className="academy-example"><h2>See it in real life</h2><p>{l.example}</p></section><section className="academy-lab"><h2>Try a real-world activity</h2><p>{l.task}</p><Link className="button button-dark" href={l.link}>{l.action} →</Link></section><AcademyFieldNotes id={l.id}/><section className="academy-lab"><h2>Continue through the construction handbook</h2><div className="handbook-related">{chapters.filter(c=>c.lessons.includes(l.id)).map(c=><Link key={c.id} href={"/build-iq/handbook/"+c.id}>{c.title} →</Link>)}</div></section><AcademyPractice key={l.id} lesson={{id:l.id,question:l.question,options:l.options,correct:l.correct}} next={next?"/build-iq/"+next.id:undefined}/><p className="academy-note">Educational concepts only. Verify safety-critical, local regulatory and product-specific decisions with qualified professionals and authoritative documentation.</p></article><SiteFooter/></main>}
