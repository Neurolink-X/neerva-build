"use client";
import {useState} from "react";
import Image from "next/image";
import {signatureWallGallery} from "@/modules/studio/signature-wall-gallery";
type Artwork=typeof signatureWallGallery[number];
function GalleryArtwork({art,detail=false}:{art:Artwork;detail?:boolean}){
 const [failed,setFailed]=useState(false);
 return <span className={"signature-wall-art signature-art-"+art.tone} style={detail?{aspectRatio:art.width+"/"+art.height}:undefined}>
 {failed?<span className="signature-art-unavailable" role="status">Artwork image unavailable</span>:<Image src={art.src} alt={detail?art.description:""} width={art.width} height={art.height} unoptimized loading={detail?"eager":"lazy"} onError={()=>setFailed(true)} />}
 </span>;
}
export function SignatureWallGallery(){
 const [expanded,setExpanded]=useState<string|null>(null);
 const selected=signatureWallGallery.find(d=>d.id===expanded);
 return <section className="signature-wall-gallery" aria-label="Signature wall gallery">
  <header><h2>Signature Wall Gallery</h2><p>Discover eight complete wall artworks, from metallic floral relief to architectural geometry and sculptural murals.</p></header>
  {selected&&<section className="signature-wall-detail" aria-label="Selected wall artwork"><div className="signature-wall-detail-title"><div><h3>{selected.name}</h3><p>{selected.style} · {selected.room}</p></div><button type="button" onClick={()=>setExpanded(null)}>Close detail</button></div><GalleryArtwork key={selected.id} art={selected} detail/><p className="signature-art-description">{selected.description}</p></section>}
  <div className="signature-wall-grid">{signatureWallGallery.map(d=><button type="button" key={d.id} aria-expanded={expanded===d.id} onClick={()=>setExpanded(v=>v===d.id?null:d.id)}><GalleryArtwork art={d}/><span className="signature-wall-card-label"><strong>{d.name}</strong><small>{d.style} · {d.room}</small></span></button>)}</div>
  <p className="signature-wall-note">AI-generated room concepts and digital wall artwork references, not photographs of installed products. Sculptural designs may require specialist relief work or a mural artist.</p>
 </section>;
}
