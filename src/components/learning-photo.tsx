import Image from "next/image";
export function LearningPhoto({src,alt,caption,width,height}:{src:string;alt:string;caption:string;width:number;height:number}){
 return <figure className="learning-photo" style={{margin:0,minWidth:0,maxWidth:420}}><Image src={src} alt={alt} width={width} height={height} unoptimized loading="lazy" decoding="async" fetchPriority="low" style={{display:"block",width:"100%",height:"auto",borderRadius:10}}/><figcaption style={{fontSize:12,lineHeight:1.5,marginTop:6}}>{caption}</figcaption></figure>
}
