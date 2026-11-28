/** Photo luminance is applied once to composed pigment colors, preserving alpha.
 * Input is an artwork-only scratch rectangle; never mutate source pixels. */
const lightFactors=Array.from({length:256},(_,i)=>Math.max(.35,Math.min(1.35,i/190)));
export function shadeArtworkPixels(data:Uint8ClampedArray,luma:Uint8Array,stride:number,left:number,top:number,width:number){
 for(let row=0,i=0;i<data.length;row++){const start=(top+row)*stride+left;for(let col=0;col<width&&i<data.length;col++,i+=4){if(data[i+3]===0)continue;const factor=lightFactors[luma[start+col]];data[i]=Math.round(data[i]*factor);data[i+1]=Math.round(data[i+1]*factor);data[i+2]=Math.round(data[i+2]*factor);}}
}
