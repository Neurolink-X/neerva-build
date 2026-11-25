
import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {SiteCaseLab,SiteRecordTemplates} from "@/components/site-practice-lab";
import {WorkmanshipLibrary} from "@/components/workmanship-library";
import {chapters} from "@/modules/home/handbook";
import {practiceEdition,siteCases} from "@/modules/home/site-practice";
import "../academy.css";
export const metadata:Metadata={title:"Practical Construction Site Lab | Neerva Academy",description:"Practise real-world construction decisions, learn practical workmanship checks, identify defects and understand what records to request on site.",alternates:{canonical:"/build-iq/site-practice"}};
export default function SitePractice(){return <main className="catalog-page"><SiteHeader/><article className="academy handbook-page"><Link href="/build-iq">← Academy</Link><header className="academy-hero"><span className="eyebrow">NEERVA SITE PRACTICE LAB</span><h1>Learn what to do when things go wrong.</h1><p>{siteCases.length} simulated site situations, practical decision exercises, Hindi summaries, practical workmanship checks and site record templates.</p><p lang="hi">साइट पर क्या पूछें, कौन सा रिकॉर्ड रखें और कब विशेषज्ञ को बुलाएं — उदाहरणों से समझें।</p><p className="handbook-status">Revision {practiceEdition.revision} · Updated {practiceEdition.updated} · Review by {practiceEdition.reviewDue} · {practiceEdition.status}</p></header><nav className="academy-hub-nav" aria-label="Site practice sections"><a href="#case-library">Site situations</a><a href="#workmanship">Workmanship & quality</a><a href="#site-records">Site record templates</a><Link href="/build-iq#handbook">Construction handbook</Link></nav><WorkmanshipLibrary/><SiteCaseLab stages={chapters.map(c=>({id:c.id,title:c.title}))}/><SiteRecordTemplates/><aside className="academy-note"><strong>Know the limits.</strong><p>These examples support informed conversations, not structural, electrical or safety approvals. Use current project documentation and qualified professionals. Prices are illustrative. No data is transmitted or payment initiated.</p></aside></article><SiteFooter/></main>}
