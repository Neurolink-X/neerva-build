import type {Metadata} from "next";
import {AdminCommandCentre} from "@/components/admin-command-centre";
export const metadata:Metadata={title:"Admin command centre | Neerva Build",robots:{index:false,follow:false}};
export default function AdminPage(){return <AdminCommandCentre/>}
