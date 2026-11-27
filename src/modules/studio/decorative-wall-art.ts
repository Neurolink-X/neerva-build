import type {Motif} from "./wall-patterns.ts";
type P=[number,number];
// Original wall artwork. Coordinates share a 3:2 design reference; the photo
// editor maps them to the selected wall. No copied wallpaper or third-party assets.
const curve=(a:P,b:P,c:P,d:P,steps=24):P[]=>Array.from({length:steps+1},(_,i):P=>{const t=i/steps,s=1-t;return [s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]];});
const join=(...segments:P[][])=>segments.flatMap((p,i)=>i?p.slice(1):p);
const stroke=(points:P[],alpha=.65,weight=1):Motif=>({points,alpha,weight});
const fill=(points:P[],alpha=.6):Motif=>({points,alpha,filled:true});
const oval=(x:number,y:number,r:number,alpha=.7,filled=true,weight=1):Motif=>({points:Array.from({length:73},(_,i):P=>{const t=i/72*Math.PI*2;return [x+r*Math.cos(t),y+r*1.5*Math.sin(t)];}),alpha,filled,weight});
const arc=(x:number,y:number,r:number,start:number,end:number,alpha=.75,weight=1.2)=>stroke(Array.from({length:49},(_,i):P=>{const t=start+(end-start)*i/48;return [x+r*Math.cos(t),y+r*1.5*Math.sin(t)];}),alpha,weight);
const arch=(x:number,top:number,w:number,bottom:number,alpha:number,filled=true):Motif=>{
 const cy=top+w*.75,pts:P[]=[[x-w/2,bottom],[x-w/2,cy],...Array.from({length:41},(_,i):P=>{const a=Math.PI+i*Math.PI/40;return [x+w/2*Math.cos(a),cy+w*.75*Math.sin(a)];}),[x+w/2,bottom]];
 return filled?fill(pts,alpha):stroke(pts,alpha,1.4);
};
function leaf(a:P,b:P,width:number,alpha=.7):Motif{
 const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len*width,ny=dx/len*width;
 const m:P=[(a[0]+b[0])/2,(a[1]+b[1])/2];
 return fill(join(curve(a,[m[0]+nx,m[1]+ny],[b[0]+nx*.6,b[1]+ny*.6],b,12),curve(b,[b[0]-nx*.5,b[1]-ny*.5],[m[0]-nx,m[1]-ny],a,12)),alpha);
}
function blossom(x:number,y:number,r:number):Motif[]{
 const petals=Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return leaf([x,y],[x+Math.cos(a)*r,y+Math.sin(a)*r*1.5],r*.42,.72)});
 return [...petals,oval(x,y,r*.18,.9)];
}
const rolling=(y:number,amp:number,phase:number,alpha:number)=>fill([[0,1],...Array.from({length:73},(_,i):P=>{const x=i/72;return [x,y+amp*Math.sin(x*5.4+phase)+amp*.18*Math.sin(x*13+phase)]}),[1,1]],alpha);
const floralStem=join(curve([.08,.98],[.11,.73],[.36,.72],[.29,.46]),curve([.29,.46],[.23,.24],[.5,.2],[.44,.05]));
const bambooStems=[{x:.14,y:.09,end:.52},{x:.29,y:0,end:.7},{x:.43,y:.03,end:.47}];
const forestTrunks=[.11,.27,.46,.66,.85];
export const decorativeArt={
 sunDisc:{name:"Sun and circle mural",motifs:[oval(.64,.38,.22,.72),rolling(.68,.10,1.5,.25),rolling(.81,.07,-.7,.62),arc(.64,.38,.255,-1.1,2.4,.55,1.15)]},
 orbit:{name:"Luxury orbit rings",motifs:[oval(.42,.48,.28,.10),oval(.60,.46,.225,.46,false,2.1),arc(.42,.48,.29,-2.4,2.4,.85,2),arc(.42,.48,.24,-.3,2.75,.48,1.1),oval(.70,.29,.065,.85)]},
 eclipse:{name:"Soft eclipse composition",motifs:[oval(.43,.46,.25,.22),oval(.58,.49,.235,.70),arc(.43,.46,.29,Math.PI*.6,Math.PI*1.85,.75,1.3),oval(.77,.18,.045,.55)]},
 layeredArches:{name:"Layered arch mural",motifs:[arch(.30,.13,.43,1,.24),arch(.53,.04,.46,1,.46),arch(.76,.28,.33,1,.70),arch(.53,.09,.36,.96,.78,false),oval(.84,.16,.06,.50)]},
 abstractLeaves:{name:"Abstract botanical mural",motifs:[oval(.80,.23,.13,.27),rolling(.83,.12,2.2,.22),fill(join(curve([0,1],[.14,.62],[.38,.64],[.47,.12]),curve([.47,.12],[.64,.57],[.40,.82],[.32,1])),.40),leaf([.32,1],[.14,.30],.17,.44),leaf([.38,.79],[.76,.35],.20,.75),leaf([.25,.95],[.05,.64],.13,.52),stroke(curve([.30,1],[.45,.78],[.59,.55],[.76,.35]),.85,1.3)]},
 floralScroll:{name:"Floral vine feature wall",motifs:[stroke(floralStem,.9,2.1),stroke(curve([.18,.84],[.04,.58],[.11,.38],[.26,.37]),.76,1.5),stroke(curve([.28,.61],[.53,.72],[.61,.44],[.46,.40]),.78,1.5),stroke(curve([.36,.24],[.18,.23],[.13,.14],[.21,.09]),.68,1.25),leaf([.16,.83],[.05,.65],.065,.74),leaf([.23,.70],[.43,.66],.075,.68),leaf([.28,.47],[.09,.45],.055,.64),leaf([.37,.31],[.54,.16],.058,.75),...blossom(.26,.37,.045),...blossom(.46,.40,.048),...blossom(.21,.09,.037),...blossom(.44,.07,.033),...blossom(.56,.18,.028)]},
 bamboo:{name:"Bamboo garden stencil",motifs:bambooStems.flatMap((s,i)=>{const endX=s.x+(i===1?-.05:.08);const y=s.end,stem=curve([s.x,s.y],[s.x-.03,.18],[endX+.02,y-.13],[endX,y]);return [stroke(stem,.60+i*.12,1.5),...Array.from({length:5},(_,j)=>{const p=stem[Math.min(stem.length-1,4+j*4)],side=j%2?1:-1;return leaf(p,[p[0]+side*(.08+j*.006),p[1]+.12],.022,.28+i*.15)}),...Array.from({length:4},(_,j)=>{const p=stem[5+j*5];return leaf(p,[p[0]+.11,p[1]+.06],.024,.45+i*.08)})];})},
 forest:{name:"Woodland silhouette mural",motifs:[rolling(.85,.06,1.2,.20),...forestTrunks.flatMap((x,i)=>{const h=.12+(i%3)*.065,root=.95,dx=i%2?.025:-.02;return [stroke(curve([x,root],[x+dx,.66],[x-dx,.40],[x+dx,h]),.64,2.2),...Array.from({length:5},(_,j)=>{const y=.70-j*.10,side=j%2?1:-1;return stroke(curve([x,y],[x+side*.08,y-.035],[x+side*.09,y-.15],[x+side*.14,y-.18]),.42+(j%2)*.18,1.05)})];}),rolling(.94,.025,-1,.48)]},
 mountain:{name:"Layered mountain mural",motifs:[oval(.75,.26,.105,.55),fill([[0,1],[0,.60],[.18,.33],[.34,.54],[.49,.21],[.73,.60],[.90,.39],[1,.56],[1,1]],.20),fill([[0,1],[0,.75],[.19,.53],[.38,.74],[.63,.43],[.83,.68],[1,.57],[1,1]],.39),rolling(.88,.055,2.1,.70)]},
 decoFan:{name:"Art Deco fan wall",motifs:Array.from({length:3},(_,row)=>Array.from({length:5},(_,col)=>{const x=.09+col*.205+(row%2?.10:0),y=.32+row*.34;return [arc(x,y,.101,Math.PI,2*Math.PI,.72,1.1),arc(x,y,.076,Math.PI,2*Math.PI,.43,.8),...Array.from({length:5},(_,j)=>{const a=Math.PI+j*Math.PI/4;return stroke([[x,y],[x+.101*Math.cos(a),y+.1515*Math.sin(a)]],.60,.8)})];}).flat()).flat()},
 scallop:{name:"Soft scalloped accent",motifs:[...Array.from({length:5},(_,i)=>{const x=.10+i*.20;return arch(x,.51,.20,1,.49)}),...Array.from({length:5},(_,i)=>arc(.10+i*.20,.66,.10,Math.PI,2*Math.PI,.78,1.4)),stroke([[0,.88],[1,.88]],.22,.8)]}
} satisfies Record<string,{name:string;motifs:Motif[]}>;
/** Curved petal lattice for a painted feature wall, not a square tile grid. */
export const luxuryLattice:Motif[]=Array.from({length:4},(_,row)=>Array.from({length:5},(_,col)=>{
 const x=col*.25+(row%2?.125:0),y=row*.33;
 return stroke(join(curve([x,y],[x+.06,y+.10],[x+.06,y+.22],[x,y+.33]),curve([x,y+.33],[x-.06,y+.22],[x-.06,y+.10],[x,y])),.72,1.3);
}).flat()).flat();
