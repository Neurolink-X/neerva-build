import type {MetadataRoute} from "next";
export default function manifest():MetadataRoute.Manifest{
 return {
  id:"/",name:"NEERVA BUILD — House Planning & Materials",short_name:"NEERVA BUILD",
  description:"Plan your plot, explore construction material specifications, and prepare private dealer requests.",
  start_url:"/",scope:"/",display:"standalone",display_override:["standalone","minimal-ui"],
  background_color:"#f5f4ef",theme_color:"#263e33",
  lang:"en-IN",
  icons:[
   {src:"/icon",sizes:"512x512",type:"image/png",purpose:"any"},
   {src:"/icon",sizes:"512x512",type:"image/png",purpose:"maskable"},
   {src:"/apple-icon",sizes:"180x180",type:"image/png",purpose:"any"}
  ]
 };
}
