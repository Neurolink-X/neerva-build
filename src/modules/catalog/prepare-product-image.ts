// Browser-only photo preparation. Do not retain decoded bitmaps or canvases.
export const MAX_SOURCE_BYTES=3*1024*1024;
export const MAX_IMAGE_EDGE=1600;
export const MAX_OUTPUT_BYTES=700*1024;
export const acceptedImageTypes=["image/jpeg","image/png","image/webp"] as const;
export function fitImage(width:number,height:number,maxEdge=MAX_IMAGE_EDGE){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width*height>24_000_000)throw Error("Photo dimensions are too large or invalid.");
 const scale=Math.min(1,maxEdge/Math.max(width,height));
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export function matchesImageType(b:Uint8Array,type:string){
 const jpeg=b[0]===255&&b[1]===216&&b[2]===255;
 const png=b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10;
 const webp=String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP";
 return type==="image/jpeg"&&jpeg||type==="image/png"&&png||type==="image/webp"&&webp;
}
export async function prepareProductImage(file:File):Promise<{blob:Blob;extension:string}>{
 if(file.size<1||file.size>MAX_SOURCE_BYTES||!matchesImageType(new Uint8Array(await file.slice(0,12).arrayBuffer()),file.type))throw Error("Select a valid JPEG, PNG or WebP up to 3 MB.");
 const bitmap=await createImageBitmap(file);
 const canvas=document.createElement("canvas");
 try{
  const size=fitImage(bitmap.width,bitmap.height);canvas.width=size.width;canvas.height=size.height;
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("Photo processing unavailable.");
  ctx.drawImage(bitmap,0,0,size.width,size.height);
  for(const quality of [.88,.78,.68]){
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",quality));
   if(blob?.type==="image/webp"&&blob.size<=MAX_OUTPUT_BYTES)return {blob,extension:"webp"};
  }
  // Do not silently upload oversized or unreadable photos.
  throw Error("Photo could not be optimized to 700 KB. Choose a smaller photo.");
 }finally{bitmap.close();canvas.width=0;canvas.height=0}
}
