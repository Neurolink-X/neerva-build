import type {Metadata} from "next";
import {AdminOverview} from "@/components/admin-overview";
export const metadata:Metadata={title:"Admin command centre | Neerva Build",robots:{index:false,follow:false}};
export default function AdminPage(){return <AdminOverview/>}
