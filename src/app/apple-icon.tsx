import {ImageResponse} from "next/og";
export const size={width:180,height:180};
export const contentType="image/png";
export default function Icon(){
 return new ImageResponse(
  <div style={{height:"100%",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#263e33"}}>
   <div style={{width:103,height:103,border:"5px solid #d6e6d8",borderRadius:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <span style={{fontSize:76,fontWeight:800,color:"#fff9ed",fontFamily:"sans-serif",lineHeight:1}}>N</span>
   </div>
  </div>,{...size});
}
