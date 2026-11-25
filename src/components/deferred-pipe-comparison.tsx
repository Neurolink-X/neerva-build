"use client";
import {useState} from "react";
import dynamic from "next/dynamic";
const Comparison=dynamic(()=>import("./pipe-comparison-category").then(m=>m.PipeComparisonCategory),{loading:()=> <p role="status">Loading comparison…</p>});
export function DeferredPipeComparison({category}:{category:string}){const [open,setOpen]=useState(false);return <details className="category-guidance" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Compare technical specifications</summary>{open&&<Comparison category={category}/>}</details>}
