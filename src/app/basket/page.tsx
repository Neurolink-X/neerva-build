import type {Metadata} from "next";
import {MaterialListBuilder} from "@/components/material-list-builder";
import "./basket.css";
export const metadata:Metadata={title:"Personal Material List — NEERVA BUILD",description:"Prepare a private, local construction material list. No live prices or confirmed orders.",robots:{index:false,follow:false}};
export default function BasketPage(){return <MaterialListBuilder/>}
