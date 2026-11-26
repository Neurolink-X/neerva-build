import type {MetadataRoute} from "next";
import {launchBrand} from "@/modules/pwa/launch-brand";
export default function manifest():MetadataRoute.Manifest{
 return {
  id:"/",name:launchBrand.name,short_name:launchBrand.name,
  description:"Plan your plot, explore construction material specifications, and prepare private dealer requests.",
  start_url:"/",scope:"/",display:"standalone",display_override:["standalone","minimal-ui"],
  background_color:launchBrand.background,theme_color:launchBrand.theme,
  lang:"en-IN",
  icons:[
   {src:"/icon",sizes:"512x512",type:"image/png",purpose:"any"},
   {src:"/icon",sizes:"512x512",type:"image/png",purpose:"maskable"},
   {src:"/apple-icon",sizes:"180x180",type:"image/png",purpose:"any"}
  ]
 };
}
