import type {Metadata} from "next";
import {AdminWorkspace} from "@/components/admin-workspace";
import "./operations.css";
export const metadata:Metadata={robots:{index:false,follow:false}};
export default function AdminLayout({children}:{children:React.ReactNode}){return <AdminWorkspace>{children}</AdminWorkspace>}
