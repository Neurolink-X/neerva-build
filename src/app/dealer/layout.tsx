import type {ReactNode} from "react";
import {DealerWorkspace} from "@/components/dealer-workspace";
import "../admin/operations.css";
export default function Layout({children}:{children:ReactNode}){return <DealerWorkspace>{children}</DealerWorkspace>}
