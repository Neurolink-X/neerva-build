"use client";
import {useState} from "react";
import Link from "next/link";
import {dailyQuestions,questions,quizScore,type Question} from "@/modules/home/build-iq";
export function BuildIQ(){
 const [round,setRound]=useState<readonly Question[]>([]),[answers,setAnswers]=useState<number[]>([]),[notice,setNotice]=useState("");
 const q=round[answers.length],finished=round.length>0&&!q,score=quizScore(round,answers);
 function start(daily:boolean){setRound(daily?dailyQuestions(Math.floor(Date.now()/86400000)):questions);setAnswers([]);setNotice("")}
 async function share(){const text="I got "+score+"/"+round.length+" in Neerva Build IQ. Try the free building knowledge quiz: "+window.location.origin+"/build-iq";try{if(navigator.share)await navigator.share({title:"Build IQ",text});else{await navigator.clipboard.writeText(text);setNotice("Quiz link copied.")}}catch{setNotice("Share was not completed.")}}
 const last=answers.length?round[answers.length-1]:null;
 return <section className="build-iq" aria-label="Construction knowledge challenge">
 <div className="iq-start"><button type="button" className="button button-dark" onClick={()=>start(true)}>Daily 3-question challenge</button><button type="button" className="button button-outline" onClick={()=>start(false)}>Practice all {questions.length} questions</button></div>
 {!round.length?<div className="iq-panel"><h2>Test what you know about homes.</h2><p>Three rotating questions or the full practice set. No account, purchase, countdown or rewards required.</p></div>:<div className="iq-panel">
 <div className="iq-progress"><span>{answers.length} / {round.length} answered</span><strong>{score} correct</strong><progress value={answers.length} max={round.length} aria-label="Quiz progress"/></div>
 {last&&<div className="iq-feedback" role="status"><strong>{answers[answers.length-1]===last.correct?"Correct!":"Learn something new"}</strong><p>{last.why}</p><Link href={last.href}>Explore this topic →</Link></div>}
 {q?<div key={q.id}><span className="iq-topic">{q.topic}</span><h2>{q.prompt}</h2><div className="iq-options">{q.options.map((option,i)=><button type="button" key={option} onClick={()=>setAnswers([...answers,i])}>{option}</button>)}</div></div>:finished&&<div><h2>Your result: {score} / {round.length}</h2><p>Use the explanations to explore topics further, or try the practice round.</p><button type="button" className="button button-outline" onClick={()=>void share()}>Share my result</button></div>}
 <p role="status">{notice}</p></div>}
 <div className="iq-links"><Link href="/family-homes">Explore home ideas →</Link><Link href="/design-studio/visualizer">Try wall colours →</Link><Link href="/learn">Read building guides →</Link><Link href="/calculators">Explore calculators →</Link></div></section>
}
