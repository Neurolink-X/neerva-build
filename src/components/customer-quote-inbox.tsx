"use client";
import {SecureOperationsList} from "./secure-operations-list";
export function CustomerQuoteInbox(){return <SecureOperationsList endpoint="/api/customer/quotes" title="Your material requests" description="Private RFQs and itemised dealer offers appear here after the dedicated Neerva database is connected." arrays={[{key:"requests",label:"My requests",fields:["material_description","quantity","unit","city","status","created_at"]}]}/>}
