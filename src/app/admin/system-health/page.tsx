import {SystemHealthPanel} from "@/components/system-health-panel";
export const metadata={title:"System health & errors",robots:{index:false,follow:false}};
export default function Page(){return <main className="admin-catalog-workbench"><div><h1>System health & errors</h1><p>Investigate recorded incidents and track resolution.</p></div><SystemHealthPanel/></main>}
