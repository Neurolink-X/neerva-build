"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type Media={id:string;storage_path:string;alt_text:string;published:boolean;url?:string};
const bucket="neerva-catalog-media";
export function AdminProductMedia({productId}:{productId:string}){
 const [rows,setRows]=useState<Media[]>([]),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[revision,setRevision]=useState(0);
 const lock=useRef(false);
 useEffect(()=>{if(!open)return;let active=true;async function load(){try{const db=createNeervaBrowserClient();if(!db)throw Error("Storage unavailable.");const {data,error}=await db.from("catalog_product_media").select("id,storage_path,alt_text,published").eq("product_id",productId).order("created_at");if(error)throw error;const media=(data??[]) as Media[];const signed=await db.storage.from(bucket).createSignedUrls(media.map(m=>m.storage_path),300);const mapped=media.map(m=>({...m,url:signed.data?.find(s=>s.path===m.storage_path)?.signedUrl??undefined}));if(active)setRows(mapped)}catch{if(active)setNotice("Media could not be loaded. Refresh and retry.")}}void load();return()=>{active=false}},[open,productId,revision]);
 async function upload(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(lock.current)return;const form=e.currentTarget,f=new FormData(form),file=f.get("photo"),alt=String(f.get("alt")??"").trim();
  if(!(file instanceof File)||file.size<1||file.size>3145728||!["image/jpeg","image/png","image/webp"].includes(file.type)||alt.length<3||alt.length>180||f.get("rights")!=="on"){setNotice("Choose an authorized JPEG, PNG or WebP up to 3 MB and enter accurate alternative text.");return}
  lock.current=true;setBusy(true);setNotice("");
  try{const db=createNeervaBrowserClient();if(!db)throw Error("Storage unavailable.");
   const b=new Uint8Array(await file.slice(0,12).arrayBuffer());const jpeg=b[0]===255&&b[1]===216&&b[2]===255,png=b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71,webp=String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP";
   if(!(file.type==="image/jpeg"&&jpeg||file.type==="image/png"&&png||file.type==="image/webp"&&webp))throw Error("File contents do not match its image type.");
   const ext=jpeg?"jpg":png?"png":"webp",path=productId+"/"+crypto.randomUUID()+"."+ext;
   const result=await db.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});if(result.error)throw result.error;
   const saved=await db.from("catalog_product_media").insert({product_id:productId,storage_path:path,alt_text:alt,published:false});
   if(saved.error){const rollback=await db.storage.from(bucket).remove([path]);throw Error(rollback.error?"Metadata save failed; storage cleanup needs review.":"Metadata save failed; upload removed.")}
   form.reset();setNotice("Draft photo saved. Review it before publication.");setRevision(n=>n+1);
  }catch(err){setNotice(err instanceof Error?err.message:"Upload failed.")}finally{lock.current=false;setBusy(false)}
 }
 async function update(row:Media,action:"publish"|"hide"|"remove",alt?:string){
  if(lock.current)return;if(action==="publish"&&!window.confirm("Publish this genuine product image? Confirm rights and exact product identity."))return;if(action==="remove"&&!window.confirm("Remove this image from the catalog?"))return;
  lock.current=true;setBusy(true);setNotice("");
  try{const db=createNeervaBrowserClient();if(!db)throw Error("Storage unavailable.");
   if(action==="remove"){const hidden=await db.from("catalog_product_media").update({published:false}).eq("id",row.id).eq("product_id",productId).select("id").single();if(hidden.error)throw hidden.error;
    const removed=await db.storage.from(bucket).remove([row.storage_path]);if(removed.error)throw Error("Image hidden; storage removal failed. Retry.");
    const deleted=await db.from("catalog_product_media").delete().eq("id",row.id).eq("product_id",productId).select("id").single();if(deleted.error)throw deleted.error;
   }else{const saved=await db.from("catalog_product_media").update({published:action==="publish",...(alt?{alt_text:alt}:{})}).eq("id",row.id).eq("product_id",productId).select("id").single();if(saved.error)throw saved.error}
   setNotice("Media updated.");setRevision(n=>n+1);
  }catch(err){setNotice(err instanceof Error?err.message:"Media update failed.")}finally{lock.current=false;setBusy(false)}
 }
 return <details onToggle={e=>setOpen(e.currentTarget.open)}><summary>Product images</summary>{open&&<div className="admin-record"><p>Upload genuine product photos you have permission to use. Draft media is private. For replacement, upload a new photo then hide or remove the old one.</p><form className="catalog-admin-form" onSubmit={e=>void upload(e)}><label>Photo<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required/></label><label>Alternative text<input name="alt" required minLength={3} maxLength={180}/></label><label className="wide-field"><span><input name="rights" type="checkbox" required/> I have verified the product identity and image rights.</span></label><button disabled={busy}>Upload draft image</button></form><p role="status">{notice}</p><button type="button" disabled={busy} onClick={()=>setRevision(n=>n+1)}>Refresh previews</button>{rows.map(m=><article key={m.id} className="admin-record">{m.url&&<a href={m.url} target="_blank" rel="noreferrer">Open image preview</a>}<strong>{m.alt_text} · {m.published?"Published":"Draft"}</strong><form className="catalog-admin-form" onSubmit={e=>{e.preventDefault();void update(m,m.published?"publish":"hide",String(new FormData(e.currentTarget).get("alt")).trim())}}><label>Alternative text<input name="alt" defaultValue={m.alt_text} required minLength={3} maxLength={180}/></label><button disabled={busy}>Save description</button></form><div className="admin-inline"><button disabled={busy} onClick={()=>void update(m,m.published?"hide":"publish")}>{m.published?"Hide":"Publish"}</button><button disabled={busy} onClick={()=>void update(m,"remove")}>Remove</button></div></article>)}</div>}</details>
}
