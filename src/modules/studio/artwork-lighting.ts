/** Photo luminance is applied once to composed pigment colors, preserving alpha.
 * Input is an artwork-only scratch rectangle; never mutate source pixels. */
export function shadeArtworkPixels(data:Uint8ClampedArray,luma:Uint8Array,stride:number,left:number,top:number,width:number){
 for(let i=0,j=0;i<data.length;i+=4,j++){if(data[i+3]===0)continue;const source=luma[(top+Math.floor(j/width))*stride+left+j%width];const factor=Math.max(.35,Math.min(1.35,source/190));data[i]=Math.round(data[i]*factor);data[i+1]=Math.round(data[i+1]*factor);data[i+2]=Math.round(data[i+2]*factor);}
}
