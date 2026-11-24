/**
 * Self-hosted QR Model 2 Version 10 / EC level M encoder, for verified
 * UPI intent text (max 213 UTF-8 bytes). One fixed version avoids oversized
 * third-party scripts and external QR-image services.
 * This is a QR *encoder*, never payment/UTR verification.
 */
const SIZE=57,DATA_BYTES=216,EC_BLOCK_BYTES=26;
type Mat={bits:boolean[][];fixed:boolean[][]};
const fresh=():Mat=>({bits:Array.from({length:SIZE},()=>Array<boolean>(SIZE).fill(false)),
 fixed:Array.from({length:SIZE},()=>Array<boolean>(SIZE).fill(false))});
function mul(x:number,y:number){
 let z=0;for(let i=7;i>=0;i--){
  z=(z<<1)^((z>>>7)*0x11d);
  z^=((y>>>i)&1)*x;
 }return z;
}
function divisor(degree:number){
 const result=new Uint8Array(degree);result[degree-1]=1;
 let root=1;
 for(let i=0;i<degree;i++){
  for(let j=0;j<degree;j++){
   result[j]=mul(result[j],root);
   if(j+1<degree)result[j]^=result[j+1];
  }
  root=mul(root,2);
 }
 return result;
}
function remainder(data:Uint8Array,poly:Uint8Array){
 const out=new Uint8Array(poly.length);
 for(const byte of data){
  const factor=byte^out[0];out.copyWithin(0,1);out[out.length-1]=0;
  for(let j=0;j<poly.length;j++)out[j]^=mul(poly[j],factor);
 }
 return out;
}
function payload(content:string){
 const bytes=new TextEncoder().encode(content);
 if(bytes.length>213||bytes.length<1)throw Error("QR_CONTENT_LENGTH_UNSUPPORTED");
 const bits:number[]=[];
 const put=(value:number,len:number)=>{for(let i=len-1;i>=0;i--)bits.push((value>>>i)&1)};
 put(4,4);put(bytes.length,16);
 for(const b of bytes)put(b,8);
 for(let i=0;i<Math.min(4,DATA_BYTES*8-bits.length);i++)bits.push(0);
 while(bits.length%8)bits.push(0);
 const words=new Uint8Array(DATA_BYTES);for(let i=0;i<bits.length;i++)words[i>>>3]|=bits[i]<<(7-(i&7));
 const firstPad=Math.ceil(bits.length/8);
 for(let i=firstPad;i<DATA_BYTES;i++)words[i]=(i-firstPad)%2===0?0xec:0x11;
 return words;
}
function codewords(content:string){
 const data=payload(content),gen=divisor(EC_BLOCK_BYTES);
 const blocks:{data:Uint8Array;ecc:Uint8Array}[]=[];
 let at=0;
 for(let i=0;i<5;i++){
  const length=i===4?44:43;
  const block=data.slice(at,at+length);at+=length;
  blocks.push({data:block,ecc:remainder(block,gen)});
 }
 const result:number[]=[];
 for(let i=0;i<44;i++)for(const block of blocks)if(i<block.data.length)result.push(block.data[i]);
 for(let i=0;i<EC_BLOCK_BYTES;i++)for(const block of blocks)result.push(block.ecc[i]);
 if(result.length!==346)throw Error("QR_INTERNAL_LENGTH_ERROR");
 return Uint8Array.from(result);
}
function set(m:Mat,x:number,y:number,on:boolean){
 if(x>=0&&y>=0&&x<SIZE&&y<SIZE){m.bits[y][x]=on;m.fixed[y][x]=true}
}
function functions(m:Mat){
 for(let i=8;i<SIZE-8;i++){set(m,6,i,i%2===0);set(m,i,6,i%2===0)}
 const finder=(cx:number,cy:number)=>{
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
   const dist=Math.max(Math.abs(dx),Math.abs(dy));
   set(m,cx+dx,cy+dy,dist!==2&&dist!==4);
  }
 };
 finder(3,3);finder(SIZE-4,3);finder(3,SIZE-4);
 for(const x of [6,28,50])for(const y of [6,28,50]){
  if((x===6&&y===6)||(x===6&&y===50)||(x===50&&y===6))continue;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)
   set(m,x+dx,y+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
 }
 for(let i=0;i<=8;i++){if(i!==6)set(m,8,i,false);if(i!==6)set(m,i,8,false)}
 for(let i=0;i<8;i++)set(m,SIZE-1-i,8,false);
 for(let i=0;i<7;i++)set(m,8,SIZE-1-i,false);
 set(m,8,SIZE-8,true);
 // Version 10 BCH(18,6) function modules in two corners.
 let rem=10;for(let i=0;i<12;i++)rem=(rem<<1)^(((rem>>>11)&1)*0x1f25);
 const vb=(10<<12)|rem;
 for(let i=0;i<18;i++){
  const bit=((vb>>>i)&1)!==0;
  set(m,SIZE-11+i%3,Math.floor(i/3),bit);
  set(m,Math.floor(i/3),SIZE-11+i%3,bit);
 }
}
function applyFormat(m:Mat){
 // Error-correction level M has format bits 00, mask 0 has bits 000.
 let rem=0;for(let i=0;i<10;i++)rem=(rem<<1)^(((rem>>>9)&1)*0x537);
 const format=rem^0x5412;
 const bit=(i:number)=>((format>>>i)&1)!==0;
 for(let i=0;i<=5;i++)set(m,8,i,bit(i));
 set(m,8,7,bit(6));set(m,8,8,bit(7));set(m,7,8,bit(8));
 for(let i=9;i<15;i++)set(m,14-i,8,bit(i));
 for(let i=0;i<8;i++)set(m,SIZE-1-i,8,bit(i));
 for(let i=8;i<15;i++)set(m,8,SIZE-15+i,bit(i));
 set(m,8,SIZE-8,true);
}
export function upiQrModules(content:string):boolean[][]{
 if(!content.startsWith("upi://pay?")||!content.includes("cu=INR")||
   !content.includes("pa=")||!content.includes("am="))throw Error("INVALID_UPI_PAYLOAD");
 const bytes=codewords(content),m=fresh();functions(m);
 let index=0;
 for(let right=SIZE-1;right>=1;right-=2){
  if(right===6)right=5;
  for(let vert=0;vert<SIZE;vert++){
   const y=((right+1)&2)===0?SIZE-1-vert:vert;
   for(let j=0;j<2;j++){
    const x=right-j;
    if(m.fixed[y][x])continue;
    const dark=index<bytes.length*8?((bytes[index>>>3]>>>(7-(index&7)))&1)!==0:false;
    m.bits[y][x]=dark!==((x+y)%2===0);index++;
   }
  }
 }
 if(index!==2768)throw Error("QR_PLACEMENT_INVALID");
 applyFormat(m);
 return m.bits;
}
export function upiQrSvgPath(content:string):string{
 const modules=upiQrModules(content),parts:string[]=[];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;){
  if(!modules[y][x]){x++;continue}
  const start=x;while(x<SIZE&&modules[y][x])x++;
  parts.push("M"+start+" "+y+"h"+(x-start)+"v1h-"+(x-start)+"z");
 }
 return parts.join("");
}
export const UPI_QR_SIZE=SIZE;
