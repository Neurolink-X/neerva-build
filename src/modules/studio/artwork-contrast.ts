/** Preserve the requested base and hue. When a design pigment is too close
 * to its base, move it toward the nearest legible dark or light endpoint.
 * The UI discloses the resulting digital pigment; this is not a paint SKU. */
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const luminance=(c:number[])=>c.map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const ratio=(a:number[],b:number[])=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
export function artworkContrast(base:string,accent:string){return ratio(rgb(base),rgb(accent));}
export function readableArtworkAccent(base:string,accent:string){
 if(!/^#[0-9a-f]{6}$/i.test(base)||!/^#[0-9a-f]{6}$/i.test(accent))return accent;
 const b=rgb(base),a=rgb(accent),minimum=2.6;
 if(ratio(b,a)>=minimum)return accent;
 const candidates=[0,255].flatMap(end=>{if(ratio(b,[end,end,end])<minimum)return [];let lo=0,hi=1;
  const blend=(t:number)=>a.map(v=>Math.round(v+(end-v)*t));
  for(let i=0;i<12;i++){const m=(lo+hi)/2;if(ratio(b,blend(m))>=minimum)hi=m;else lo=m;}
  return [{t:hi,hex:"#"+blend(hi).map(v=>v.toString(16).padStart(2,"0")).join("")}];
 });
 return candidates.sort((x,y)=>x.t-y.t)[0]?.hex??accent;
}
