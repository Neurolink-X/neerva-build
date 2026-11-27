import {ImageResponse} from "next/og";
import {createElement as h} from "react";
export const dynamic="force-static";
/** Explicit 192px PNG for Chromium installability; preserve existing app identity. */
export function GET(){
 return new ImageResponse(h("div",{style:{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#263e33"}},h("div",{style:{width:104,height:104,border:"5px solid #d6e6d8",borderRadius:25,display:"flex",alignItems:"center",justifyContent:"center"}},h("span",{style:{fontSize:78,fontWeight:800,color:"#fff9ed",fontFamily:"sans-serif",lineHeight:1}},"N"))),{width:192,height:192});
}
