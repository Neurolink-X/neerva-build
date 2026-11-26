import {AdminCoupons} from "@/components/admin-coupons";
import type {Metadata} from "next";
import {AdminCommandCentre} from "@/components/admin-command-centre";
export const metadata:Metadata={title:"Marketing and offers | Neerva Build Admin",robots:{index:false,follow:false}};
export default function MarketingPage(){return <><AdminCommandCentre marketing/><AdminCoupons/></>}
