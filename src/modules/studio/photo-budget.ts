/** Inspect encoded dimensions before browser decode; bound memory independently of compressed file size. */
export const maxPhotoPixels=16_000_000;
export const maxPhotoSide=8192;
export const maxPreviewSide=1280;
export function photoDimensionsAllowed(width:number,height:number):boolean{
 return Number.isSafeInteger(width)&&Number.isSafeInteger(height)&&width>0&&height>0&&width<=maxPhotoSide&&height<=maxPhotoSide&&width*height<=maxPhotoPixels;
}
export function encodedPhotoDimensions(bytes:Uint8Array):{width:number;height:number}|null{
 const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),n=bytes.length;
 const ascii=(i:number,s:string)=>i+s.length<=n&&[...s].every((c,k)=>bytes[i+k]===c.charCodeAt(0));
 const u24=(i:number)=>bytes[i]+bytes[i+1]*256+bytes[i+2]*65536;
 if(n>=24&&bytes[0]===137&&ascii(1,"PNG")&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10&&ascii(12,"IHDR")&&d.getUint32(8)===13)return {width:d.getUint32(16),height:d.getUint32(20)};
 if(n>=30&&ascii(0,"RIFF")&&ascii(8,"WEBP")){
  if(ascii(12,"VP8X")&&d.getUint32(16,true)>=10){if(bytes[20]&2)return null;return {width:1+u24(24),height:1+u24(27)};}
  if(ascii(12,"VP8L")&&d.getUint32(16,true)>=5&&bytes[20]===47){const bits=d.getUint32(21,true);return {width:1+(bits&16383),height:1+((bits>>>14)&16383)};}
  if(ascii(12,"VP8 ")&&d.getUint32(16,true)>=10&&bytes[23]===157&&bytes[24]===1&&bytes[25]===42)return {width:d.getUint16(26,true)&16383,height:d.getUint16(28,true)&16383};
 }
 if(n>=4&&bytes[0]===255&&bytes[1]===216){
  let i=2;
  while(i+3<n){
   if(bytes[i++]!==255)return null;
   while(i<n&&bytes[i]===255)i++;
   const marker=bytes[i++];if(marker===217||marker===218||i+2>n)return null;
   if(marker===1||(marker>=208&&marker<=215))continue;
   const len=d.getUint16(i);if(len<2||i+len>n)return null;
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&len>=8)return {height:d.getUint16(i+3),width:d.getUint16(i+5)};
   i+=len;
  }
 }
 return null;
}

/** Bound the working surfaces independently of the uploaded file size.
 * At most six RGBA buffers plus one luminance buffer are retained while editing. */
export function paintPreviewDimensions(width:number,height:number,hints:{memory?:number;cores?:number;saveData?:boolean}={}){
 if(!photoDimensionsAllowed(width,height))throw new RangeError("Invalid photo dimensions");
 const lite=hints.saveData===true||(hints.memory!==undefined&&hints.memory<=4)||(hints.cores!==undefined&&hints.cores<=2);
 const side=lite?896:maxPreviewSide,pixels=lite?480000:1200000;
 const scale=Math.min(1,side/Math.max(width,height),Math.sqrt(pixels/(width*height)));
 return {width:Math.max(1,Math.floor(width*scale)),height:Math.max(1,Math.floor(height*scale))};
}
