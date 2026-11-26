import Link from "next/link";
import type {Metadata} from "next";
import {MaterialListBuilder} from "@/components/material-list-builder";
import {redirect} from "next/navigation";
import "./basket.css";
export const metadata:Metadata={title:"Material planner — NEERVA BUILD",description:"Prepare a private construction material list.",robots:{index:false,follow:false}};
export default async function BasketPage({searchParams}:{searchParams:Promise<{view?:string}>}){const q=await searchParams;if(q.view!=="planner")redirect("/checkout?cart=1");return <><div className="section"><Link href="/checkout?cart=1" className="button button-dark">Open shopping cart →</Link></div><MaterialListBuilder/></>}
