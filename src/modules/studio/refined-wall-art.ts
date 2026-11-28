import type {Motif} from "./wall-patterns.ts";
type P=[number,number];
const seq=<T>(n:number,f:(i:number)=>T)=>Array.from({length:n},(_,i)=>f(i));
const fill=(points:P[],tone=0,alpha=.94):Motif=>({points,filled:true,tone,alpha});
const line=(points:P[],tone=.2,weight=.8):Motif=>({points,tone,weight,alpha:.9});
const ellipse=(x:number,y:number,rx:number,ry:number,tone:number)=>fill(seq(65,i=>[x+rx*Math.cos(i*Math.PI/32),y+ry*Math.sin(i*Math.PI/32)]),tone);
const curve=(a:P,b:P,c:P,d:P)=>seq(41,i=>{const t=i/40,s=1-t;return [s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]] as P});
function leaf(a:P,b:P,w:number,tone:number){
 const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,m:P=[(a[0]+b[0])/2,(a[1]+b[1])/2],n:P=[-dy/l*w,dx/l*w];
 const edge=(f:number)=>[...curve(a,[m[0]+n[0]*f,m[1]+n[1]*f],[b[0]+n[0]*f*.6,b[1]+n[1]*f*.6],b),...curve(b,[b[0]-n[0]*f*.65,b[1]-n[1]*f*.65],[m[0]-n[0]*f,m[1]-n[1]*f],a).slice(1)];
 return [fill(edge(1),tone-.14),fill(edge(.71),tone+.12,.82),line([a,m,b],.48,.48)];
}
function flower(x:number,y:number,r:number,n:number){
 return [...seq(n,i=>{const a=i*2*Math.PI/n;return leaf([x,y],[x+r*Math.cos(a),y+r*1.45*Math.sin(a)],r*.36,i%2?.25:-.16)}).flat(),ellipse(x,y,r*.16,r*.23,-.4),...seq(9,i=>ellipse(x+r*.11*Math.cos(i*2.4),y+r*.17*Math.sin(i*2.4),.003,.0045,.6))];
}
function vine(a:P,b:P,c:P,d:P,bloom:boolean){
 const stem=curve(a,b,c,d);
 return [line(stem,-.58,2),line(stem.map(([x,y])=>[x-.0015,y-.003]),.46,.6),...seq(8,i=>{const p=stem[5+i*4],s=i%2?1:-1,end:P=[p[0]+s*(.075+(i%3)*.013),p[1]-.075-(i%2)*.035];return [...leaf(p,end,.025,-.14),...(bloom&&i%3===1?flower(p[0]+.018,p[1]-.025,.041,5):[])];}).flat(),...(bloom?flower(d[0],d[1],.051,5):[])];
}
const bird=(x:number,y:number,s:number)=>line([...curve([x-s,y],[x-s*.65,y-s*.35],[x-s*.25,y-s*.24],[x,y+s*.18]),...curve([x,y+s*.18],[x+s*.30,y-s*.28],[x+s*.65,y-s*.4],[x+s,y]).slice(1)],-.52,1.3);
function ridge(y:number,amp:number,phase:number,tone:number){return fill([[0,1],...seq(97,i=>{const x=i/96;return [x,y+amp*Math.sin(x*8+phase)+.035*Math.sin(x*19+phase*.6)] as P}),[1,1]],tone);}
function river(){return [ellipse(.72,.20,.09,.135,.63),ridge(.43,.09,.9,.31),ridge(.56,.11,2.4,-.02),ridge(.70,.09,-.8,-.28),fill([[.45,1],[.76,1],...curve([.76,1],[.86,.80],[.25,.73],[.56,.61]),...curve([.56,.61],[.12,.75],[.62,.84],[.45,1])],.48),...seq(14,i=>line([[.41+(i%3)*.015,.72+i*.018],[.60+(i%4)*.03,.723+i*.018]],.50,.5)),...vine([.02,.98],[.08,.6],[.15,.31],[.36,.12],false),...[[.42,.24,.025],[.49,.19,.02],[.56,.25,.024]].map(([x,y,s])=>bird(x,y,s))];}
function lotus(){return [ellipse(.72,.21,.10,.15,.48),...seq(8,i=>line(seq(65,j=>[j/64,.47+i*.07+.027*Math.sin(j/64*8+i*.7)]),i%2?.45:-.24,.75)),...[[.27,.55,.075],[.63,.46,.105],[.83,.64,.065]].flatMap(([x,y,r])=>[ellipse(x,y+r*.83,r*1.32,r*.31,-.45),line([[x,y+r*.8],[x,y]],-.36,1),...seq(7,i=>{const a=Math.PI+i*Math.PI/6;return leaf([x,y+.025],[x+r*Math.cos(a),y+r*1.28*Math.sin(a)],r*.24,i%2?.31:-.08)}).flat(),ellipse(x,y+.016,r*.17,r*.065,.62)])];}
function forest(){return [...seq(12,i=>{const x=.035+i*.083,top=.16+(i*7%6)*.065,wide=.015+(i%3)*.007;return [fill([[x-wide,.99],[x+wide,.99],[x+wide*.24,top],[x-wide*.22,top]],-.3+(i%3)*.11),...seq(4,j=>{const y=top+j*.105;return leaf([x,y+.035],[x+(j%2?1:-1)*(.065+j*.012),y-.04],.024,-.1+(i%3)*.12)}).flat()];}).flat(),ridge(.87,.035,1,-.4)];}
function wave(seed:number){
 // Contiguous ribbons with many narrow tonal bands model directional light,
 // rather than overlapping flat blocks. Width extends to both wall edges.
 return seq(7,i=>{const y=-.25+i*.22,phase=i*.48+seed*.8,edge=(x:number)=>y+.12*Math.sin(x*Math.PI*2+phase)+.04*Math.sin(x*10+phase);return seq(18,j=>{const a=j/18,b=(j+1)/18,t=(j+.5)/18;return fill([...seq(65,k=>[k/64,edge(k/64)+a*.28] as P),...seq(65,k=>[1-k/64,edge(1-k/64)+b*.28+.002] as P)],.68*Math.sin(t*Math.PI*1.65)-.30,.98);});}).flat();
}
function petals(){return [...[[.34,.47,.30],[.77,.61,.21]].flatMap(([x,y,r])=>[...seq(8,i=>{const a=i*Math.PI/4;return leaf([x,y],[x+r*Math.cos(a),y+r*1.18*Math.sin(a)],r*.27,i%2?.12:-.24)}).flat(),ellipse(x,y,r*.12,r*.15,.18),...seq(14,i=>{const a=i*2.4;return ellipse(x+r*.13*Math.cos(a),y+r*.18*Math.sin(a),.006,.009,.63)})])];}
function stone(){return seq(8,i=>{const x=i/8;return seq(14,j=>{const u=x+j/112,v=x+(j+1)/112+.001,f=(a:number)=>curve([a,-.02],[a+.08,.20],[a-.045,.65],[a+.035,1.02]);return fill([...f(u),...f(v).reverse()],.62*Math.sin(j/14*Math.PI*1.6)-.3);});}).flat();}
const frame=(x:number,y:number,w:number,h:number)=>[fill([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],-.14,.68),line([[x,y+h],[x,y],[x+w,y],[x+w,y+h],[x,y+h]],.55,1.1),line([[x+.012,y+h-.018],[x+.012,y+.018],[x+w-.012,y+.018],[x+w-.012,y+h-.018],[x+.012,y+h-.018]],-.45,.8)];
function arch(x:number,w:number,top:number,bottom:number){const r=w/2,cy=top+r*1.5;return [[x-r,bottom],[x-r,cy],...seq(65,i=>[x+r*Math.cos(Math.PI+i*Math.PI/64),cy+r*1.5*Math.sin(Math.PI+i*Math.PI/64)] as P),[x+r,bottom]] as P[];}
function panels(arched:boolean,ornament:boolean){return [...[[.035,.23],[.285,.43],[.735,.23]].flatMap(([x,w])=>arched?[fill(arch(x+w/2,w,.075,.94),-.16,.76),line(arch(x+w/2,w-.02,.095,.925),.62,1.3),line(arch(x+w/2,w-.05,.135,.91),-.46,.8)]:frame(x,.06,w,.86)),...(ornament?vine([.34,.78],[.44,.61],[.56,.46],[.67,.25],false):[])];}
function spiral(){return seq(180,i=>{const t=i/179,a=i*2.399963,r=.29*Math.sqrt(t);return ellipse(.5+r*Math.cos(a),.42+r*1.5*Math.sin(a),.003+t*.011,.004+t*.016,.12+t*.42);});}
/** Original layered pigment studies, not copied wallpaper or physical relief. */
export const refinedArtwork:Partial<Record<string,()=>Motif[]>>={
 orbit:()=>spiral(),riverSunset:()=>river(),lotusPond:()=>lotus(),flyingBirds:()=>[ellipse(.73,.24,.12,.18,.45),...seq(9,i=>bird(.16+i*.084,.31+(i%3)*.09,.023+(i%4)*.008)),ridge(.76,.07,2,-.12),ridge(.88,.04,-1,-.34)],
 gardenTree:()=>[...vine([.05,1],[.08,.65],[.42,.54],[.78,.14],true),...vine([.20,.75],[.26,.42],[.43,.26],[.49,.10],false),...vine([.33,.58],[.50,.52],[.65,.45],[.91,.30],true)],
 floralScroll:()=>[...vine([.04,.94],[.15,.53],[.61,.44],[.94,.12],true),...vine([.10,.73],[.22,.47],[.26,.22],[.39,.12],true)],
 blossomBranch:()=>[...vine([.01,.21],[.30,.32],[.46,.32],[.84,.18],true),...vine([.23,.29],[.40,.48],[.52,.58],[.76,.64],true),...flower(.86,.30,.06,5)],
 forest:()=>forest(),aurora:()=>wave(2),sculptWave:()=>wave(0),sculptRibbon:()=>wave(1),sculptFold:()=>petals(),sculptStone:()=>stone(),
 atelierPanel:()=>panels(false,true),regencyPanel:()=>panels(true,false),grandSalon:()=>panels(false,false),archGallery:()=>panels(true,true)
};
