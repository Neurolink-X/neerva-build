/** Shared bounded material generator. Profiles preserve each existing viewer's
 * reviewed appearance until a visual parity release deliberately changes it. */
export type TexturedFinish="tile"|"marble"|"wood"|"panel"|"acp";
export type TextureProfile="residential"|"commercial";
export const MATERIAL_TILE_SIZE=128;
export function materialTextureBytes(kind:TexturedFinish,profile:TextureProfile){
 const n=MATERIAL_TILE_SIZE,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  let v:number;
  if(profile==="residential"){
   const grain=Math.sin(x*.47+y*.12)*Math.sin(y*.53+x*.19),vein=Math.sin(x*.14+y*.07+2*Math.sin(y*.065)),noise=((x*73+y*151)%19)-9;
   v=kind==="tile"?(x%64<2||y%64<2?120:238+noise):kind==="marble"?(Math.abs(vein)<.13?158:235+grain*14):kind==="wood"?205+Math.sin(x*.7+3*Math.sin(y*.04))*22+noise:kind==="panel"?(x%32<2?135:230+noise):(x%64<2||y%64<2?130:230+noise);
  }else{
   const a=x/n,b=y/n,vein=Math.abs(Math.sin(a*16+b*6+1.8*Math.sin(b*10)+.6*Math.sin(a*38)));
   v=kind==="tile"?(x%64<2||y%64<2?158:247):kind==="marble"?Math.round(255*(.79+.21*Math.min(1,vein*4))):kind==="wood"?Math.round(255*(.87+.11*Math.sin(a*190+2*Math.sin(b*6)))):x%32<2||kind==="acp"&&y%64<2?145:245;
  }
  const i=(y*n+x)*4;data[i]=data[i+1]=data[i+2]=Math.max(0,Math.min(255,v));data[i+3]=255;
 }
 return data;
}
