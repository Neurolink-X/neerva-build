import {DeliveryPolicyPanel} from "@/components/delivery-policy-panel";
import {DealerPricingPanel} from "@/components/dealer-pricing-panel";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
export const metadata={title:"Dealer pricing",robots:{index:false,follow:false}};
export default function Page(){return <main className="catalog-page"><SiteHeader/><section className="section ops-content"><DealerPricingPanel/><DeliveryPolicyPanel role="dealer"/></section><SiteFooter/></main>}
