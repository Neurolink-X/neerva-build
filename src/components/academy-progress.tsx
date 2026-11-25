"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {progressKey,readProgress,updateProgress,type Progress} from "@/modules/home/academy-progress-model";
const empty:Progress={completed:[],practiced:[]};
function load(){try{return readProgress(localStorage.getItem(progressKey))}catch{return empty}}
export function AcademyProgress({total}:{total:number}){
 const [p,setP]=useState(empty);
 useEffect(()=>{const timer=window.setTimeout(()=>setP(load()),0);return()=>clearTimeout(timer)},[]);
 return <div className="academy-progress"><div><strong>{p.completed.length} of {total} lessons explored</strong><small>Your progress stays on this device.</small></div><progress aria-label="Learning progress" value={p.completed.length} max={total}/></div>
}
type Practice={id:string;question:string;options:readonly {label:string;feedback:string}[];correct:number};
export function AcademyPractice({lesson,next}:{lesson:Practice;next?:string}){
 const [p,setP]=useState(empty),[choice,setChoice]=useState<number|null>(null),[notice,setNotice]=useState(""),[ready,setReady]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>{setP(load());setReady(true)},0);return()=>clearTimeout(timer)},[]);
 function mark(key:keyof Progress){const stored=load();const next=updateProgress({completed:[...p.completed,...stored.completed],practiced:[...p.practiced,...stored.practiced]},lesson.id,key);setP(next);try{localStorage.setItem(progressKey,JSON.stringify(next));setNotice("Progress saved on this device.")}catch{setNotice("Storage unavailable; progress is not retained after refresh.")}}
 return <section className="academy-practice"><h2>Put the idea into practice</h2><details><summary>Optional Build IQ challenge</summary><p>{lesson.question}</p><div className="academy-options">{lesson.options.map((o,i)=><button key={o.label} type="button" aria-pressed={choice===i} disabled={!ready} onClick={()=>{setChoice(i);if(i===lesson.correct)mark("practiced")}}>{o.label}</button>)}</div>{choice!==null&&<p className="academy-feedback" role="status"><strong>{choice===lesson.correct?"That's right.":"Consider the trade-off."}</strong> {lesson.options[choice].feedback}</p>}</details><div className="academy-actions"><button type="button" className="button button-dark" disabled={!ready||p.completed.includes(lesson.id)} onClick={()=>mark("completed")}>{p.completed.includes(lesson.id)?"Lesson explored ✓":"Mark lesson explored"}</button>{next&&<Link className="button button-outline" href={next}>Explore next lesson →</Link>}<Link href="/build-iq">All lessons</Link></div><p role="status">{notice}</p></section>
}
