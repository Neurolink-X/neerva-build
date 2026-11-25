import type {Metadata} from "next";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {RoomLabStudio} from "@/components/room-lab";
import "./room-lab.css";
export const metadata:Metadata={title:"Room Lab — free furniture and colour planner",description:"Experiment with furniture arrangements, room dimensions and finishes in a private interactive workspace.",alternates:{canonical:"/room-lab"}};
export default function RoomLab(){return <main className="catalog-page"><SiteHeader/><section className="page-hero page-hero-compact"><span className="eyebrow">NEERVA · CREATIVE STUDIO</span><h1>Reimagine your room.</h1><p>Try furniture layouts and colour combinations before making a real-world decision. No account or purchase needed.</p></section><RoomLabStudio/><SiteFooter/></main>}
