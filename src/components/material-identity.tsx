import type {DemoProduct} from "@/modules/catalog/marketplace";
import {mediaFamily} from "@/modules/catalog/media-integrity";
export function MaterialIdentity({name,category,brand,product}:{name:string;category:string;brand?:string;product?:DemoProduct}){
 const family=product?mediaFamily(product):category.replaceAll("-"," ");
 return <div aria-label={"Photo not available for "+name} className="catalog-material-identity" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",padding:"clamp(12px,3vw,28px)",gap:8,background:"linear-gradient(145deg,#f4f5ef,#e5ebe1)",color:"#244635",overflow:"hidden"}}><span style={{fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase"}}>PHOTO NOT AVAILABLE</span>{brand&&<small>{brand}</small>}<strong style={{fontSize:"clamp(14px,2vw,22px)",lineHeight:1.25,maxWidth:"100%",overflowWrap:"anywhere"}}>{name}</strong><small style={{maxWidth:"100%",overflowWrap:"anywhere"}}>{family.replaceAll("-"," ")} · ask for exact product photo</small></div>
}
