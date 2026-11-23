import Image from "next/image";
import {brandMediaFor} from "@/modules/catalog/brand-media";

/** Distinguishes real public logo assets from a text-only name.
 * Brand identity does not establish authorised dealership or SKU authenticity.
 */
export function BrandMark({name,small=false}:{name:string;small?:boolean}){
 const media=brandMediaFor(name);
 if(!media)return <span className={small?"nb-brand-name nb-brand-name-small":"nb-brand-name"}>{name}</span>;
 return <span className={small?"nb-brand-mark nb-brand-mark-small":"nb-brand-mark"}>
  <Image src={media.logo} alt={name+" brand logo (identity reference only)"}
   width={small?88:145} height={small?33:54}
   sizes={small?"88px":"145px"} unoptimized
   style={{objectFit:"contain",maxWidth:"100%",height:"auto"}}/>
 </span>;
}
