import {DealerProductRequests} from "@/components/dealer-product-requests";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
export const metadata={title:"My dealer products",robots:{index:false,follow:false}};
export default function Page(){return <main className="catalog-page"><SiteHeader/><section className="section catalog-admin-content"><DealerProductRequests role="dealer"/></section><SiteFooter/></main>}
