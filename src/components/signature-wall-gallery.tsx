"use client";
import {useState} from "react";
import {signatureWallGallery} from "@/modules/studio/signature-wall-gallery";
import {hasWallRaster} from "@/modules/studio/wall-textures";
import {useWallTextures,WallTextureSwatch} from "./studio-wall-texture";
import {WallArtworkSwatch} from "./studio-wall-artwork-swatch";
export function SignatureWallGallery(){
 const [expanded,setExpanded]=useState<string|null>(null);
 const selected=signatureWallGallery.find(d=>d.id===expanded);
 const keys=[...new Set([...(selected?[selected.pattern]:[]),...signatureWallGallery.map(d=>d.pattern)])].filter(hasWallRaster).join(",");
 const textures=useWallTextures(keys);
 function artwork(d:typeof signatureWallGallery[number],detail=false){
  const texture=textures[d.pattern];
  return texture?<WallTextureSwatch texture={texture} base={d.base} accent={d.accent} intensity={1} detail={detail}/>:<WallArtworkSwatch pattern={d.pattern} base={d.base} accent={d.accent} intensity={1}/>;
 }
 return <section className="signature-wall-gallery" aria-label="Signature wall gallery">
  <header><h2>Signature Wall Gallery</h2><p>Eight curated wall artworks. Explore complete compositions with fixed designer palettes, without paint controls.</p></header>
  {selected&&<section className="signature-wall-detail" aria-label="Selected wall artwork"><div className="signature-wall-detail-title"><div><h3>{selected.name}</h3><p>{selected.style} · {selected.room}</p></div><button type="button" onClick={()=>setExpanded(null)}>Close detail</button></div><div className="signature-wall-art" role="img" aria-label={selected.name+" full wall concept"}>{artwork(selected,true)}</div></section>}
  <div className="signature-wall-grid">{signatureWallGallery.map(d=><button type="button" key={d.id} aria-expanded={expanded===d.id} onClick={()=>setExpanded(v=>v===d.id?null:d.id)}><span className="signature-wall-art">{artwork(d)}</span><span className="signature-wall-card-label"><strong>{d.name}</strong><small>{d.style} · {d.room}</small></span></button>)}</div>
  <p className="signature-wall-note">Digital artwork concepts, not photographs of installed products. Some dimensional effects need a specialist mural artist.</p>
 </section>;
}
