import type {Motif} from "./wall-patterns.ts";
type P=[number,number];
const seq=<T>(n:number,fn:(i:number)=>T)=>Array.from({length:n},(_,i)=>fn(i));
const stroke=(points:P[],alpha=.8,weight=1,tone=0):Motif=>({points,alpha,weight,tone});
const fill=(points:P[],alpha=.9,tone=0):Motif=>({points,alpha,filled:true,tone});
const oval=(x:number,y:number,rx:number,ry:number,alpha=.9,tone=0)=>fill(seq(49,i=>[x+rx*Math.cos(i*Math.PI/24),y+ry*Math.sin(i*Math.PI/24)]),alpha,tone);
const rect=(x:number,y:number,w:number,h:number,alpha=.9,tone=0)=>fill([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],alpha,tone);
const ribbon=(x:number,y:number,w:number,h:number,phase:number,alpha=.9,tone=0)=>fill([...seq(65,i=>{const t=i/64;return [x+t*w,y+Math.sin(t*Math.PI*2+phase)*h*.34] as P}),...seq(65,i=>{const t=1-i/64;return [x+t*w,y+h*.35+Math.sin(t*Math.PI*2+phase)*h*.34] as P})],alpha,tone);
const arc=(x:number,y:number,rx:number,ry:number,start:number,end:number,alpha=.9,weight=1,tone=0)=>stroke(seq(65,i=>{const a=start+(end-start)*i/64;return [x+rx*Math.cos(a),y+ry*Math.sin(a)]}),alpha,weight,tone);
const box=(x:number,y:number,w:number,h:number,alpha=.8,weight=1,tone=0)=>stroke([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],alpha,weight,tone);
function petal(a:P,b:P,width:number,tone=0):Motif{
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
 return fill(seq(41,i=>{const t=i/40*Math.PI*2,u=(1-Math.cos(t))/2;return [a[0]+dx*u-dy/length*Math.sin(t)*width,a[1]+dy*u+dx/length*Math.sin(t)*width]}),.88,tone);
}
const blossom=(x:number,y:number,r:number,n=7)=>[...seq(n,i=>{const a=i*2*Math.PI/n;return petal([x,y],[x+r*Math.cos(a),y+r*1.45*Math.sin(a)],r*.27,i%2?.36:-.22)}),oval(x,y,r*.18,r*.25,.96,-.4),oval(x-r*.035,y-r*.045,r*.07,r*.10,.95,.65)];
function branch(x:number,y:number,dx:number,dy:number,seed:number){
 const stem=seq(41,i=>{const t=i/40;return [x+dx*t+.025*Math.sin(t*3),y+dy*t] as P});
 return [stroke(stem,.9,2,-.45),...seq(8,i=>{const p=stem[5+i*4],s=i%2?1:-1,k=.085+(i%3)*.014;const end:P=[p[0]+s*k,p[1]-.09];return [petal(p,end,.025,i%2?.35:-.24),stroke([p,end],.55,.5,.55)];}).flat(),...blossom(stem[40][0],stem[40][1],.033+(seed%3)*.008,6)];
}
function landscape(seed:number){
 const sky=oval(.68-(seed%3)*.14,.24,.105,.16,.8,.58);
 const ridges=seq(6,i=>{const y=.35+i*.105,amp=.095+(i%3)*.025;return fill([[0,1],...seq(97,j=>{const t=j/96;return [t,y+amp*Math.sin(t*8+seed*.73+i*.61)+.026*Math.sin(t*23+i)+.009*Math.sin(t*57+seed)] as P}),[1,1]],.78, .42-i*.155)});
 const details=seq(24,i=>{const x=((i*37+seed*13)%97)/97,y=.77+((i*17)%19)/100;return stroke([[x,y],[Math.min(1,x+.025+(i%4)*.02),y+.002]],.38,.7,i%2?.55:-.36)});
 return [sky,...ridges,...details];
}
function inlay(seed:number){
 const cols=4+seed%3,rows=3+seed%2;
 return seq(cols*rows,i=>{const x=(i%cols+.5)/cols,y=(Math.floor(i/cols)+.5)/rows,r=(.30+seed*.011)/cols;
 const shape=seed%3===0?blossom(x,y,r,8):seed%3===1?[petal([x-r,y+r],[x+r,y-r],r*.42,-.24),petal([x-r,y-r],[x+r,y+r],r*.33,.35)]:[arc(x,y,r,r*1.4,0,2*Math.PI,.85,1.4,-.34),arc(x,y,r*.7,r,0,2*Math.PI,.7,.8,.65)];
 return [...shape,oval(x,y,r*.08,r*.1,.9,.64),...seq(4,k=>{const a=k*Math.PI/2;return oval(x+Math.cos(a)*r*1.3,y+Math.sin(a)*r*1.6,r*.06,r*.08,.7,-.2)})];
 }).flat();
}
function panel(seed:number){
 const n=3+seed%3;
 return seq(n,i=>{const x=.025+i*.95/n,w=.95/n-.012-seed*.0015,y=.06+seed*.004+(i%2)*(seed%2?.13:0),h=.86-(y-.07);
 return [rect(x+.012,y+.014,w,h,.36,-.7),rect(x,y,w,h,.63,-.18),box(x+.008,y+.008,w-.016,h-.016,.8,1.5,.65),box(x+.027,y+.034,w-.054,h-.068,.85,1.3,-.48),box(x+.039,y+.05,w-.078,h-.10,.6,.8,.42),...(seed%2?[arc(x+w/2,y+h*.39,w*.35,h*.24,Math.PI,2*Math.PI,.85,1.4,.6)]:seq(4,k=>stroke([[x+w*(k+1)/5,y+.07],[x+w*(k+1)/5,y+h-.07]],.38,.8,k%2?.45:-.4)))];
 }).flat();
}
function sculpt(seed:number){
 if(seed===0||seed===4)return seq(seed===0?9:15,i=>{const count=seed===0?9:15,x=i/count,w=1/count;return [rect(x,0,w,1,.78,-.36),...seq(8,j=>rect(x+j*w/8,0,w/8,1,.75,.58*Math.sin((j+.5)*Math.PI/8)-.28)),stroke([[x+w*.93,0],[x+w*.93,1]],.9,1,-.65)]}).flat();
 if(seed===1||seed===5)return seq(8,i=>[ribbon(-.08,.06+i*.12,1.16,.19,(seed===1?i*.28:-i*.36),.85,-.46),ribbon(-.08,.038+i*.12,1.16,.15,(seed===1?i*.28:-i*.36),.93,.24),ribbon(-.08,.025+i*.12,1.16,.055,(seed===1?i*.28:-i*.36),.86,.65)]).flat();
 const cols=seed===2||seed===6?5:4,rows=seed===2||seed===6?3:4;
 return seq(cols*rows,i=>{const x=(i%cols)/cols,y=Math.floor(i/cols)/rows,w=1/cols,h=1/rows,c:P=[x+w*(seed>=6?.37:.5),y+h*(seed>=6?.62:.5)];
 return [fill([[x,y],[x+w,y],c],.92,.63),fill([[x+w,y],[x+w,y+h],c],.92,-.18),fill([[x+w,y+h],[x,y+h],c],.94,-.62),fill([[x,y+h],[x,y],c],.92,.13),box(x+.008,y+.008,w-.016,h-.016,.55,.7,.4),stroke([[x,y],c,[x+w,y+h]],.5,.7,seed%2?.5:-.5)];
 }).flat();
}
const entry=(name:string,motifs:Motif[])=>({name,motifs});
/** Original locally generated artwork, no external images; actual relief is simulated using painted tones. */
export const premiumArt={
 silkBotanical:entry("Silk botanical inlay",inlay(0)),
 imperialVine:entry("Imperial vine embroidery",inlay(1)),
 indigoMedallion:entry("Indigo medallion print",inlay(2)),
 magnoliaRepeat:entry("Magnolia atelier print",inlay(3)),
 decoInlay:entry("Art Deco brass inlay",inlay(4)),
 moroccanFiligree:entry("Moroccan filigree",inlay(5)),
 palaceFloral:entry("Palace floral brocade",inlay(6)),
 japaneseKamon:entry("Japanese kamon textile",inlay(7)),
 sculptFlute:entry("Sculpted fluted light",sculpt(0)),
 sculptWave:entry("Sculptural wave relief",sculpt(1)),
 sculptDiamond:entry("Faceted diamond relief",sculpt(2)),
 sculptFold:entry("Folded architectural plaster",sculpt(3)),
 sculptReed:entry("Reeded shadow wall",sculpt(4)),
 sculptRibbon:entry("Flowing ribbon relief",sculpt(5)),
 sculptStone:entry("Carved limestone illusion",sculpt(6)),
 sculptPrism:entry("Prismatic light panels",sculpt(7)),
 atelierPanel:entry("Parisian atelier panelling",panel(0)),
 regencyPanel:entry("Regency arch panelling",panel(1)),
 palazzoPanel:entry("Palazzo gallery wall",panel(2)),
 artHotelPanel:entry("Boutique hotel arches",panel(3)),
 walnutPanel:entry("Walnut and brass illusion",panel(4)),
 contemporaryPanel:entry("Contemporary ribbed frames",panel(5)),
 grandSalon:entry("Grand salon moulding",panel(6)),
 archGallery:entry("Architectural arch gallery",panel(7))
} satisfies Record<string,{name:string;motifs:Motif[]}>;
/** Replace sparse artwork with dense layered originals, keeping legacy selection IDs. */
export function enrichArtwork(id:string,motifs:Motif[]):Motif[]{
 const seed=Array.from(id).reduce((s,c)=>s+c.charCodeAt(0),0);
 if(["riverSunset","mountain","oceanCliffs","desertDunes","mural","waterflow","forest","citySilhouette","flyingBirds","lotusPond"].includes(id))return [...landscape(seed),...(id==="forest"?branch(.15,.95,.18,-.69,seed):id==="lotusPond"?[...blossom(.25,.81,.07,8),...blossom(.75,.84,.06,8)]:motifs.map(m=>({...m,alpha:(m.alpha??1)*.55,tone:.2})))];
 if(["gardenTree","meadowBloom","abstractLeaves","floralScroll","bamboo","botanical","fernStencil","blossomBranch"].includes(id))return [...seq(3,i=>branch(.14+i*.30,.98,(i%2?-.05:.12),-.78+(i%3)*.10,seed+i)).flat(),...motifs.map(m=>({...m,alpha:(m.alpha??1)*.48,tone:.26}))];
 return motifs.flatMap((m,i)=>{
  const pts=m.points;const shadow:Motif={...m,points:pts.map(([x,y])=>[x+.003,y+.006]),alpha:(m.alpha??1)*.66,tone:-.48,weight:Math.min(5,(m.weight??1)*1.3)};
  const highlight:Motif={...m,points:pts.map(([x,y])=>[x-.002,y-.003]),alpha:(m.alpha??1)*.72,tone:.48,weight:(m.weight??1)*.75};
  return [shadow,{...m,tone:i%3===0?.15:-.12},highlight];
 });
}
export function motifTone(m:Motif){return Math.max(-.8,Math.min(.8,m.tone??0));}
export function artworkShade(hex:string,tone:number){
 if(!/^#[0-9a-f]{6}$/i.test(hex))return hex;
 const n=parseInt(hex.slice(1),16),target=tone<0?0:255,a=Math.min(.8,Math.abs(tone));
 return "#"+[n>>16,(n>>8)&255,n&255].map(c=>Math.round(c+(target-c)*a).toString(16).padStart(2,"0")).join("");
}
