import {DealerSettlements} from "@/components/dealer-settlements";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
export const metadata={title:"Dealer settlements",robots:{index:false,follow:false}};
export default function Page(){return <main className="catalog-page"><SiteHeader/><section className="section catalog-admin-content"><DealerSettlements role="dealer"/></section><SiteFooter/></main>}