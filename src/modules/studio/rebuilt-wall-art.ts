import type {Motif,Pattern} from "./wall-patterns.ts";
type P=[number,number];
type Finish=NonNullable<Motif["finish"]>;
const seq=<T>(n:number,f:(i:number)=>T)=>Array.from({length:n},(_,i)=>f(i));
const fill=(points:P[],tone=0,pigment=.8,finish:Finish="matte"):Motif=>({points,filled:true,tone,pigment,finish,alpha:1});
const line=(points:P[],tone=.45,weight=.65,pigment=.95):Motif=>({points,tone,weight,pigment,alpha:.94});
const rect=(x:number,y:number,w:number,h:number):P[]=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const closed=(p:P[]):P[]=>[...p,p[0]];
const ellipse=(x:number,y:number,rx:number,ry=rx*1.5,n=48):P[]=>seq(n+1,i=>[x+rx*Math.cos(i*2*Math.PI/n),y+ry*Math.sin(i*2*Math.PI/n)]);
const bez=(a:P,b:P,c:P,d:P):P[]=>seq(41,i=>{const t=i/40,s=1-t;return [s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]]});
const leaf=(a:P,b:P,w:number,tone:number):Motif[]=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,m:P=[(a[0]+b[0])/2,(a[1]+b[1])/2],n:P=[-dy/l*w,dx/l*w];return [fill([...bez(a,[m[0]+n[0],m[1]+n[1]],[b[0]+n[0]*.55,b[1]+n[1]*.55],b),...bez(b,[b[0]-n[0]*.55,b[1]-n[1]*.55],[m[0]-n[0],m[1]-n[1]],a)],tone,.87),line(bez(a,m,m,b),.48,.4)]};
const blossom=(x:number,y:number,r:number,n:number):Motif[]=>[...seq(n,i=>{const a=i*2*Math.PI/n;return leaf([x,y],[x+r*Math.cos(a),y+r*1.5*Math.sin(a)],r*.42,i%2?.35:-.12)}).flat(),fill(ellipse(x,y,r*.18),.68,1,"metal")];
const ridge=(y:number,a:number,p:number,tone:number):Motif=>fill([[0,1],...seq(81,i=>{const x=i/80;return [x,y+a*Math.sin(x*7+p)+a*.25*Math.sin(x*19-p)] as P}),[1,1]],tone,.75);
const branch=(a:P,b:P,c:P,d:P,bloom=false):Motif[]=>{const s=bez(a,b,c,d);return [line(s,-.48,1.5),...seq(7,i=>{const p=s[4+i*5],dir=i%2?1:-1;return [...leaf(p,[p[0]+dir*.08,p[1]-.09],.027,i%2?.24:-.2),...(bloom&&i%3===1?blossom(p[0]+dir*.045,p[1]-.06,.035,5):[])];}).flat()]};
const tile=(cols:number,rows:number,draw:(x:number,y:number,w:number,h:number,i:number)=>Motif[]):Motif[]=>seq(rows,r=>seq(cols,c=>draw(c/cols,r/rows,1/cols,1/rows,r*cols+c)).flat()).flat();
const framed=(x:number,y:number,w:number,h:number,detail=true):Motif[]=>[fill(rect(x,y,w,h),-.22,.76,"bevel"),fill(rect(x+w*.04,y+h*.025,w*.92,h*.95),.12,.52,"bevel"),line(closed(rect(x+w*.09,y+h*.055,w*.82,h*.89)),.56,.55),...(detail?[line(closed(rect(x+w*.15,y+h*.10,w*.70,h*.80)),-.25,.55)]:[])];
const arch=(x:number,y:number,w:number,h:number):P[]=>[[x,y+h],[x,y+w*.75],...seq(41,i=>[x+w/2+w/2*Math.cos(Math.PI+i*Math.PI/40),y+w*.75+w*.75*Math.sin(Math.PI+i*Math.PI/40)] as P),[x+w,y+h]];
function botanical():Motif[]{return [...branch([.12,1],[.18,.65],[.40,.36],[.24,.10]),...branch([.49,1],[.43,.61],[.71,.31],[.80,.06]),...branch([.89,1],[.82,.64],[.63,.48],[.73,.27],true)];}
function abstractLeaves():Motif[]{return [...leaf([.12,.95],[.36,.13],.14,-.22),...leaf([.42,.96],[.65,.06],.16,.32),...leaf([.73,.98],[.93,.29],.12,.04),line(bez([.06,.94],[.42,.8],[.46,.34],[.95,.09]),.65,1.1)];}
function eclipse():Motif[]{return [fill(ellipse(.48,.43,.25),-.42,.9,"bevel"),fill(ellipse(.57,.36,.23),.38,.5,"matte"),...seq(5,i=>line(ellipse(.48,.43,.28+i*.018),.15+i*.10,.55)),ridge(.87,.025,1,-.3)];}
function galleryArc():Motif[]{return seq(8,i=>{const r=.10+i*.045;return line(seq(49,j=>[.50+r*Math.cos(Math.PI+j*Math.PI/48),.83+r*1.5*Math.sin(Math.PI+j*Math.PI/48)] as P),i%2?.65:-.26,1.1+i*.08);}).concat(fill(ellipse(.50,.28,.075),.35,.95,"metal"));}
function celestial():Motif[]{return [fill(ellipse(.68,.27,.105),.62,.65),fill(ellipse(.715,.242,.088),-.28,.48),...seq(23,i=>{const x=.08+(i*37%83)/100,y=.08+(i*23%45)/100;return line([[x-.012,y],[x+.012,y],[x,y],[x,y-.018],[x,y+.018]],.55,.48)}),ridge(.66,.10,2,-.12),ridge(.81,.055,3,-.38)];}
function meadow():Motif[]{return seq(9,i=>{const x=.07+i*.108,y=.28+(i*7%5)*.08;return [...branch([x,1],[x-.04,.73],[x+.04,y+.12],[x,y]),...blossom(x,y,.032+(i%3)*.008,6)]}).flat();}
function dunes():Motif[]{return [fill(ellipse(.76,.20,.12),.55,.55),...seq(5,i=>ridge(.38+i*.135,.11-i*.012,i*.8,-.4+i*.14)),...seq(14,i=>line(bez([.1,.69+i*.021],[.32,.63+i*.021],[.61,.91+i*.01],[.95,.83+i*.01]),.34,.38))];}
function cliffs():Motif[]{return [fill([[0,0],[.28,.13],[.23,.35],[.40,.66],[.32,1],[0,1]],-.48,.9,"bevel"),fill([[1,.18],[.78,.30],[.72,.54],[.61,.79],[.77,1],[1,1]],-.14,.8,"bevel"),...seq(12,i=>line(bez([.32,.57+i*.033],[.47,.49+i*.042],[.64,.76+i*.019],[.76,.67+i*.027]),.44,.7)),fill(ellipse(.62,.22,.08),.65,.5)];}
function skyline():Motif[]{return [...seq(14,i=>{const x=i/14,w=.06,h=.18+(i*7%9)*.052,y=.86-h;return [fill(rect(x,y,w,h),-.45+i%3*.16,.85,"bevel"),...seq(Math.floor(h/.07),j=>line([[x+.012,y+.035+j*.07],[x+w-.012,y+.035+j*.07]],.65,.45))]}).flat(),ridge(.88,.015,1,-.34),fill(ellipse(.73,.15,.075),.55,.7)];}
function mountain():Motif[]{return [fill(ellipse(.27,.18,.09),.58,.55),fill([[0,1],[0,.63],[.23,.27],[.42,.55],[.64,.14],[.83,.50],[1,.31],[1,1]],-.16,.7,"bevel"),fill([[.52,.35],[.64,.14],[.74,.33],[.65,.29],[.61,.38]],.65,.5),ridge(.72,.11,3,-.32),ridge(.88,.05,1,-.50)];}
function waterflow():Motif[]{return seq(12,i=>{const t=i/12,a=bez([0,.40+t*.5],[.38,.13+t*.5],[.66,.87+t*.25],[1,.35+t*.65]),b=bez([0,.44+t*.5],[.38,.17+t*.5],[.66,.91+t*.25],[1,.39+t*.65]);return [fill([...a,...b.reverse()],i%2?.38:-.21,.5+i%3*.16,"bevel"),line(a,.62,.45)]}).flat();}
function fern():Motif[]{return [...seq(3,i=>{const x=.24+i*.25,s=bez([x,.94],[x-.08,.67],[x+.03,.34],[x+.06,.09]);return [line(s,-.48,1.5),...seq(11,j=>{const p=s[2+j*3],r=.105*(1-j/13);return [...leaf(p,[p[0]-r,p[1]-.06],.012,-.22),...leaf(p,[p[0]+r,p[1]-.07],.012,.24)]}).flat()] }).flat()];}
function sunburst():Motif[]{return [fill(ellipse(.5,.82,.12),.52,1,"metal"),...seq(31,i=>{const a=Math.PI+i*Math.PI/30;return line([[.5+.13*Math.cos(a),.82+.19*Math.sin(a)],[.5+.47*Math.cos(a),.82+.75*Math.sin(a)]],i%3?.62:-.25,i%3?.65:1.25);})];}
function rosetteBorder():Motif[]{return [...[.13,.87].flatMap(y=>seq(8,i=>blossom(.065+i*.125,y,.042,8)).flat()),...seq(4,i=>line([[0,.04+i*.04],[1,.04+i*.04]],.35+i*.06,.45)),line([[0,.78],[1,.78]],.55,.8)];}
function ogee():Motif[]{return tile(6,5,(x,y,w,h)=>{const p=[...bez([x+w*.5,y],[x+w,y+h*.22],[x+w*.9,y+h*.34],[x+w*.5,y+h*.5]),...bez([x+w*.5,y+h*.5],[x+w*.1,y+h*.66],[x+w*.1,y+h*.78],[x+w*.5,y+h]),...bez([x+w*.5,y+h],[x+w*.9,y+h*.78],[x+w*.9,y+h*.65],[x+w*.5,y+h*.5]),...bez([x+w*.5,y+h*.5],[x+w*.1,y+h*.34],[x+w*.1,y+h*.22],[x+w*.5,y])];return [fill(p,-.18,.55),line(p,.57,.65)]});}
function asymmetric():Motif[]{return [fill([[0,0],[.46,0],[.28,.51],[0,.72]],-.32,.9),fill([[.46,0],[1,0],[1,.35],[.72,.62],[.28,.51]],.28,.55),fill([[0,.72],[.28,.51],[.72,.62],[.44,1],[0,1]],.12,.8),line([[0,.72],[.28,.51],[.46,0]],.62,.9),line([[.28,.51],[.72,.62],[1,.35]],.62,.9)];}
function mural():Motif[]{return [fill([[0,1],[0,.77],[.28,.63],[.45,.73],[.71,.46],[1,.55],[1,1]],-.18,.85),...seq(3,i=>{const x=.18+i*.32;return framed(x,.14,.16,.32,false)}).flat(),...branch([.04,.94],[.22,.68],[.31,.35],[.42,.15],true)];}
function scallop():Motif[]{return tile(7,4,(x,y,w,h,i)=>{const p=arch(x,y,w,h*.98);return [fill(p,i%2?.23:-.16,.62,"bevel"),line(p,.54,.6)]});}
function steps():Motif[]{return [fill([[0,1],[0,.28],[.25,.28],[.25,.44],[.52,.44],[.52,.61],[.78,.61],[.78,.78],[1,.78],[1,1]],-.25,.84),line([[0,.28],[.25,.28],[.25,.44],[.52,.44],[.52,.61],[.78,.61],[.78,.78],[1,.78]],.64,1.25),...seq(4,i=>line([[i*.25,.93],[i*.25,.85+i*.02]],.45,.6))];}
function grid():Motif[]{return tile(8,6,(x,y,w,h,i)=>[fill(rect(x+.003,y+.004,w-.006,h-.008),i%3*.18-.2,.54+(i%4)*.1,"bevel"),line(closed(rect(x+.012,y+.016,w-.024,h-.032)),.55,.45)]);}
function diagonal():Motif[]{return seq(8,i=>{const x=-.7+i*.26;return [fill([[x,0],[x+.12,0],[x+.77,1],[x+.65,1]],i%3*.24-.2,.8,"matte"),line([[x+.13,0],[x+.78,1]],.58,.6)]}).flat();}
function panels():Motif[]{return [[.025,.22],[.265,.47],[.755,.22]].flatMap(([x,w])=>framed(x,.08,w,.84,false));}
function bands():Motif[]{return seq(19,i=>{const x=i/19;return [fill(rect(x,0,.024,1),i%4===0?-.3:.16,.8,"bevel"),line([[x+.024,0],[x+.024,1]],.55,.45)]}).flat();}
function medallion():Motif[]{return tile(5,4,(x,y,w,h)=>{const cx=x+w/2,cy=y+h/2;return [fill(ellipse(cx,cy,w*.4,h*.4),-.3,.8),...blossom(cx,cy,w*.28,8),line(ellipse(cx,cy,w*.43,h*.43),.58,.55)]});}
function magnolia():Motif[]{return tile(4,3,(x,y,w,h)=>[...leaf([x+w*.15,y+h*.9],[x+w*.85,y+h*.25],w*.10,-.24),...blossom(x+w*.5,y+h*.42,w*.23,6)]);}
function palace():Motif[]{return tile(5,4,(x,y,w,h)=>[line(closed(rect(x+w*.05,y+h*.07,w*.9,h*.86)),.54,.5),...blossom(x+w*.5,y+h*.5,w*.27,5),...leaf([x+w*.15,y+h*.85],[x+w*.38,y+h*.61],w*.04,-.25)]);}
function kamon():Motif[]{return tile(6,4,(x,y,w,h)=>{const cx=x+w*.5,cy=y+h*.5;return [line(ellipse(cx,cy,w*.43,h*.43),.62,.65),...seq(3,i=>{const a=i*2*Math.PI/3;return leaf([cx,cy],[cx+w*.33*Math.cos(a),cy+h*.33*Math.sin(a)],w*.11,i%2?.23:-.27)}).flat()];});}
function flute():Motif[]{return seq(17,i=>{const x=i/17;return [fill(rect(x,0,1/17,1),.08,.85,"bevel"),line([[x+.004,0],[x+.004,1]],-.35,.55)]}).flat();}
function diamondRelief():Motif[]{return tile(6,5,(x,y,w,h)=>{const p:P[]=[[x+w/2,y],[x+w,y+h/2],[x+w/2,y+h],[x,y+h/2]],c:P=[x+w/2,y+h/2];return seq(4,i=>fill([p[i],p[(i+1)%4],c],[.55,.12,-.45,-.08][i],.82,"bevel"));});}
function reed():Motif[]{return seq(28,i=>{const x=i/28;return [fill(rect(x,0,1/28,1),i%3*.1-.2,.72,"bevel"),line([[x+.006,0],[x+.006,1]],.55,.38)]}).flat();}
function prism():Motif[]{return tile(5,4,(x,y,w,h,i)=>{const a:P=[x,y],b:P=[x+w,y],c:P=[x+w,y+h],d:P=[x,y+h],m:P=[x+w*(i%2?.33:.67),y+h*.48];return [fill([a,b,m],.45,.7,"bevel"),fill([b,c,m],-.42,.9,"bevel"),fill([c,d,m],.12,.75,"bevel"),fill([d,a,m],-.15,.8,"bevel")];});}
function palazzo():Motif[]{return [...seq(5,i=>framed(.025+i*.195,.055,.17,.89)).flat(),line([[0,.04],[1,.04]],.64,1.1),line([[0,.96],[1,.96]],.64,1.1)];}
function hotel():Motif[]{return [[.05,.24],[.33,.34],[.71,.24]].flatMap(([x,w],i)=>{const p=arch(x,i===1?.035:.18,w,i===1?.91:.76);return [fill(p,-.24,.8,"bevel"),line(p,.65,1.1),line(arch(x+.015,i===1?.075:.22,w-.03,i===1?.86:.71),.45,.65),fill(rect(x+.05,.78,w-.10,.06),.28,.6,"metal")];});}
function walnut():Motif[]{return [...seq(13,i=>fill(rect(i/13,0,1/13-.004,1),i%3*.14-.32,.82,"bevel")),...seq(4,i=>line([[.08+i*.27,0],[.08+i*.27,1]],.72,1.2)),...seq(15,i=>line(bez([i/15,0],[i/15+.025,.33],[i/15-.02,.66],[i/15,1]),.24,.35,.5))];}
function contemporary():Motif[]{return [...seq(8,i=>fill(rect(i*.125,0,.052,1),-.2,.72,"bevel")),...framed(.19,.12,.62,.76,false),...seq(8,i=>line([[.24+i*.074,.17],[.24+i*.074,.83]],.38,.6))];}
export const rebuiltWallArt={
 abstractLeaves,eclipse,galleryArc,celestial,meadowBloom:meadow,desertDunes:dunes,oceanCliffs:cliffs,citySilhouette:skyline,
 botanical,mountain,waterflow,fernStencil:fern,inset:()=>[...framed(.08,.08,.84,.84),...framed(.25,.23,.50,.54)],artDecoSunburst:sunburst,royalRosette:rosetteBorder,ogee,
 asymmetric,mural,scallop,steppedColourBlock:steps,grid,diagonal,panels,bands,
 indigoMedallion:medallion,magnoliaRepeat:magnolia,palaceFloral:palace,japaneseKamon:kamon,
 sculptFlute:flute,sculptDiamond:diamondRelief,sculptReed:reed,sculptPrism:prism,
 palazzoPanel:palazzo,artHotelPanel:hotel,walnutPanel:walnut,contemporaryPanel:contemporary
} satisfies Partial<Record<Pattern,()=>Motif[]>>;
