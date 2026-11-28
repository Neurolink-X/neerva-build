import type {Motif,Pattern} from "./wall-patterns.ts";
type P=[number,number];
const seq=<T>(n:number,f:(i:number)=>T)=>Array.from({length:n},(_,i)=>f(i));
const fill=(points:P[],tone=0,pigment=1,finish:Motif["finish"]="matte"):Motif=>({points,filled:true,tone,pigment,finish,alpha:1});
const line=(points:P[],tone=.5,weight=.7,pigment=1):Motif=>({points,tone,weight,pigment,alpha:.95});
const ring=(x:number,y:number,r:number,n:number,phase=0):P[]=>seq(n+1,i=>[x+r*Math.cos(phase+i*2*Math.PI/n),y+r*1.5*Math.sin(phase+i*2*Math.PI/n)]);
const inset=(p:P[],x:number,y:number,k:number):P[]=>p.map(([a,b])=>[x+(a-x)*k,y+(b-y)*k]);
const close=(p:P[])=>[...p,p[0]];
const tones=[-.48,-.18,.16,.48,.05,.65];
/** Original geometry, regular hexagonal spacing in a 3:2 design frame.
 * Two compositions use different scale and coverage, not renamed duplicates. */
function honeycomb(cluster:boolean):Motif[]{
 const r=cluster?.103:.055,out:Motif[]=[];
 for(let col=-1;col<=Math.ceil(1/(1.5*r));col++)for(let row=-1;row<=Math.ceil(1/(Math.sqrt(3)*r*1.5));row++){
  const x=col*1.5*r,y=(row+(col%2? .5:0))*Math.sqrt(3)*r*1.5;
  if(cluster&&(x<.10||x>.92||y<.07||y>.91||((x-.53)/.43)**2+((y-.42)/.46)**2>1||((col*7+row*11)%5===0)))continue;
  const k=((col*17+row*13)%6+6)%6,p=ring(x,y,r*.97,6),inner=inset(p,x,y,.88);
  out.push(fill(p,-.58,.43,"bevel"),fill(inner,tones[k],cluster?[.1,.72,1,.2,.92,.55][k]:[.2,.5,.85,1,.36,.7][k],"bevel"));
  if(!cluster)out.push(line(close(inner),.65,.34,.65));
 }
 return out;
}
/** Isometric wirework with a true shared hexagon edge, no interior clutter. */
function cubes():Motif[]{
 const r=.075,out:Motif[]=[];
 for(let col=-1;col<=10;col++)for(let row=-1;row<=6;row++){
  const x=col*r*1.5,y=(row+(col%2?.5:0))*Math.sqrt(3)*r*1.5;
  const p=ring(x,y,r,6);
  if(x-r>1||y-r*1.5>1)continue;
  out.push(line(p,.52,.54),line([p[0],[x,y],p[2]],.48,.52),line([[x,y],p[4]],.48,.52));
 }
 return out;
}
function chevron():Motif[]{
 return seq(8,row=>seq(7,col=>{
  const x=col/6-.08,y=row/7-.08,w=1/6,h=1/7;
  const p:P[]=[[x,y],[x+w*.5,y+h*.45],[x+w,y],[x+w,y+h*.65],[x+w*.5,y+h*1.10],[x,y+h*.65]];
  return [fill(p,((row+col)%3-1)*.21,.4+((row+col)%3)*.24,"bevel"),line([p[0],p[1],p[2]],.55,.55)];
 }).flat()).flat();
}
function arches():Motif[]{
 const p=(x:number,y:number,w:number,h:number):P[]=>[[x,y+h],...seq(49,i=>[x+w/2+w/2*Math.cos(Math.PI+i*Math.PI/48),y+w*.65+w*.65*Math.sin(Math.PI+i*Math.PI/48)] as P),[x+w,y+h]];
 return [...[[.06,.20,.40,.8],[.35,.07,.40,.93],[.65,.30,.29,.70]].flatMap(([x,y,w,h],i)=>{const a=p(x,y,w,h);return [fill(a,[-.30,.33,.02][i],.5+i*.2,"matte"),line(a,.55,.8)]})];
}
function dado():Motif[]{return [fill([[0,.55],[1,.55],[1,1],[0,1]],-.15,.8,"matte"),fill([[0,.525],[1,.525],[1,.55],[0,.55]],.5,1,"metal"),...seq(5,i=>{const x=.035+i*.196,p:P[]=[[x,.62],[x+.155,.62],[x+.155,.95],[x,.95],[x,.62]];return line(p,.46,.65,.8)})];}
function ribbons():Motif[]{return seq(6,i=>{const x=-.55+i*.31;return fill([[x,0],[x+.16,0],[x+.85,1],[x+.69,1]],(i%3-1)*.28,.4+i%3*.27,"matte")});}
function discs():Motif[]{return [[.27,.37,.23],[.55,.57,.27],[.79,.29,.13]].flatMap(([x,y,r],i)=>[fill(ring(x,y,r,64),[-.3,.12,.42][i],.42+i*.27,"matte"),line(ring(x,y,r*.94,64),.58,.55)]);}
function lattice():Motif[]{return seq(9,row=>seq(7,col=>{const x=col*.18-.04+(row%2?.09:0),y=row*.13-.04;return [line([[x-.09,y],[x,y-.13],[x+.09,y],[x,y+.13],[x-.09,y]],.55,.67),fill(ring(x,y,.012,8),.7,1,"metal")]}).flat()).flat();}
function rosettes(mode:number):Motif[]{
 return seq(4,row=>seq(6,col=>{const x=.083+col/6,y=.12+row*.25,r=.068;
  const p=seq(73,i=>{const a=i*Math.PI/36,q=r*(.68+.31*Math.cos(a*(mode===0?6:8)));return [x+q*Math.cos(a),y+1.5*q*Math.sin(a)] as P});
  return [fill(p,-.24,.6,"matte"),line(p,.64,.55),line(ring(x,y,r*.87,mode===0?6:8),.35,.50),fill(ring(x,y,.013,12),.65,1,"metal")];
 }).flat()).flat();
}
function fan():Motif[]{return seq(4,row=>seq(6,col=>{const x=col*.19+(row%2?.095:0),y=.19+row*.26;return seq(5,i=>{const r=.09*(i+1)/5;return line(seq(33,j=>[x+r*Math.cos(Math.PI+j*Math.PI/32),y+1.5*r*Math.sin(Math.PI+j*Math.PI/32)] as P),.16+i*.11,.55)})}).flat()).flat();}
function border():Motif[]{return [fill([[0,0],[1,0],[1,.15],[0,.15]],-.24,.82,"matte"),fill([[0,.85],[1,.85],[1,1],[0,1]],-.24,.82,"matte"),...seq(10,i=>[line(ring(.05+i*.1,.075,.045,4),.65,.7),line(ring(.05+i*.1,.925,.045,4),.65,.7)]).flat(),...rosettes(0).filter((_,i)=>i%8===0).map(m=>({...m,alpha:.3}))];}
function inlay(mode:number):Motif[]{
 return seq(4,row=>seq(5,col=>{const x=.10+col*.20,y=.125+row*.25,r=.075;
  const a=ring(x,y,r,mode===0?4:6);
  const petals=seq(mode===0?4:6,i=>{const t=i*2*Math.PI/(mode===0?4:6),p:P[]=[[x,y],[x+r*.48*Math.cos(t-.55),y+r*.72*Math.sin(t-.55)],[x+r*Math.cos(t),y+r*1.5*Math.sin(t)],[x+r*.48*Math.cos(t+.55),y+r*.72*Math.sin(t+.55)]];return fill(p,i%2?.32:-.18,.58+i%2*.42,"metal");});
  return [line(a,.58,.5),...petals,fill(ring(x,y,.013,16),.68,1,"metal")];
 }).flat()).flat();
}
function botanical(mode:number):Motif[]{
 return seq(mode===0?6:5,i=>{const x=.09+i/(mode===0?6:5),bend=i%2?.045:-.035,stem=seq(33,j=>[x+bend*Math.sin(j/32*Math.PI),1-j/32*.94] as P);
 return [line(stem,-.45,1.2,.8),...seq(6,j=>{const p=stem[4+j*4],s=j%2?1:-1,ex=p[0]+s*.08,ey=p[1]-.075;
 const a:P[]=[p,[p[0]+s*.065,p[1]-.014],[ex,ey],[p[0]+s*.019,p[1]-.06]];
 return [fill(a,(i+j)%2?.12:-.28,.55+(j%3)*.2,"matte"),line([p,[ex,ey]],.5,.35)];
 }).flat()];}).flat();
}
const newGeometry:Partial<Record<Pattern,()=>Motif[]>>={
 hexGrid:cubes,facets:()=>honeycomb(true),angularWeave:()=>cubes().map(m=>({...m,points:m.points.map(([x,y])=>[1-y,x] as P),tone:.38,weight:.85})),herringbone:()=>chevron().filter(m=>!m.filled).map(m=>({...m,weight:1.1})),
 diamonds:lattice,decoFan:fan,jaliMedallion:()=>rosettes(0),heritage:border,
 arch:arches,split:dado,modernRibbons:ribbons,offsetCircles:discs,layeredArches:()=>seq(5,i=>{const width=.86-i*.145,x=(1-width)/2,y=.07+i*.105,bottom=.96;const p:P[]=[[x,bottom],...seq(65,j=>[.5+width/2*Math.cos(Math.PI+j*Math.PI/64),y+width*.68+width*.68*Math.sin(Math.PI+j*Math.PI/64)] as P),[x+width,bottom]];return [fill(p,(i%3-1)*.25,.51+i*.10,"matte"),line(p,.48,.65)];}).flat(),
 decoInlay:()=>inlay(0),moroccanFiligree:()=>rosettes(1),silkBotanical:()=>botanical(0),imperialVine:()=>botanical(1),bamboo:()=>seq(5,i=>{const x=.08+i*.19,lean=(i%2?.055:-.035);const stem=(y:number)=>x+lean*(1-y);return [fill([[stem(0)-.014,0],[stem(0)+.014,0],[stem(1)+.022,1],[stem(1)-.022,1]],-.2,.76,"bevel"),...seq(7,j=>{const y=.06+j*.135,a=stem(y),dir=j%2?1:-1;return [line([[a-.019,y],[a+.019,y]],.57,.65),...seq(3,k=>{const end:P=[a+dir*(.055+k*.022),y-.055-k*.023];return [fill([[a,y],[end[0]-dir*.013,end[1]+.028],end,[a+dir*.019,y-.032]],.13-k*.14,.72,"matte"),line([[a,y],end],.43,.35)];}).flat()];}).flat()];}).flat()
};
/** Shared finish pass for every visible design, including original mural motifs.
 * Preserve legacy geometry outside the active chooser. Local textures take
 * precedence in the photo renderer; these also provide their vector fallback. */
export function finishWallArt(key:Pattern,original:Motif[]):Motif[]{
 const fresh=newGeometry[key]?.()??original;
 const metal=["orbit","diamonds","decoFan","jaliMedallion","heritage","decoInlay","moroccanFiligree","angularWeave"].includes(key);
 const relief=key.startsWith("sculpt")||["atelierPanel","regencyPanel","grandSalon","archGallery"].includes(key);
 return fresh.map((m,i)=>({...m,pigment:m.pigment??(m.filled?.68+(i%4)*.10:1),finish:m.finish??(relief?"bevel":metal?"metal":"matte"),tone:Math.max(-.8,Math.min(.8,m.tone??0))}));
}
