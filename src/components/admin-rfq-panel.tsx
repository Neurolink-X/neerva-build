"use client";
import {SecureOperationsList} from "./secure-operations-list";
export function AdminRfqPanel(){return <SecureOperationsList endpoint="/api/admin/rfqs" title="Quotation operations" description="Administrator-only overview. Dealer invitations, dispatch, price approvals and amendments require the separate verified backend workflow." arrays={[{key:"requests",label:"Recent RFQs",fields:["material_description","quantity","unit","city","pincode","status","created_at"]}]}/>}
