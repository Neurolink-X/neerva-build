import {OrderOperationsPanel} from "@/components/order-operations-panel";
export const metadata={title:"Orders",robots:{index:false,follow:false}};
export default function Page(){return <main className="admin-catalog-workbench"><div><h1>Orders</h1><p>Review accepted orders and manage fulfilment.</p></div><OrderOperationsPanel role="admin"/></main>}
