import type {Pattern} from "./wall-patterns.ts";
/** Paintable full-wall compositions, no grout, panel seams or physical tile geometry. */
export const practicalPaintNames={
 eclipse:"Metallic floral frames",layeredArches:"Layered painted arches",galleryArc:"Art deco painted fan",sunDisc:"Brushed mineral wash",
 arch:"Sculpted arch and ribbons",split:"Champagne horizon",asymmetric:"Modern diagonal colour fields",scallop:"Art deco sweeping curves",
 steppedColourBlock:"Architectural colour cascade",modernRibbons:"Golden flowing ribbons",offsetCircles:"Celestial intersecting circles",
 facets:"Metallic architectural geometry",grid:"Asymmetric painted frames",diagonal:"Luxury diagonal bands",panels:"Gallery line composition",bands:"Vertical ombre accents",
 mural:"Silk brush panorama",herringbone:"Painted chevron linework",hexGrid:"Fine hexagonal linework",angularWeave:"Isometric cube linework",
 sculptDiamond:"Folded silk paint illusion",sculptPrism:"Sculpted wave paint illusion"
} as const satisfies Partial<Record<Pattern,string>>;
type Key=keyof typeof practicalPaintNames;
export function isPracticalPaintArt(p:Pattern):p is Key{return Object.hasOwn(practicalPaintNames,p);}
const clamp=(v:number)=>Math.max(0,Math.min(1,v)),g=(v:number)=>Math.exp(-v*v);
const line=(x:number,y:number,a:number,b:number,c:number,d:number)=>{const dx=c-a,dy=d-b,t=clamp(((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy||1));return Math.hypot(x-a-t*dx,y-b-t*dy);};
const rectLine=(x:number,y:number,cx:number,cy:number,w:number,h:number)=>Math.min(line(x,y,cx-w/2,cy-h/2,cx+w/2,cy-h/2),line(x,y,cx+w/2,cy-h/2,cx+w/2,cy+h/2),line(x,y,cx+w/2,cy+h/2,cx-w/2,cy+h/2),line(x,y,cx-w/2,cy+h/2,cx-w/2,cy-h/2));
const archDistance=(x:number,y:number,cx:number,rx:number,top:number,join:number)=>y<join?Math.abs(Math.hypot((x-cx)/rx,(y-join)/(join-top))-1)*rx:Math.abs(Math.abs(x-cx)-rx);
export function practicalPaintShade(key:Key,x:number,y:number){
 const grain=.009*Math.sin(x*135+y*79)*Math.cos(y*119-x*33),wash=.024*Math.sin(x*9+y*5)+.018*Math.cos(x*17-y*9);
 let v=.56+wash;
 switch(key){
 case "eclipse":{
  v=.31+wash;
  for(const [cx,cy,w,h] of [[.19,.19,.19,.25],[.51,.35,.16,.23],[.81,.18,.19,.25],[.23,.69,.18,.25],[.74,.73,.22,.27],[.87,.82,.16,.20]])v=Math.max(v,.30+.54*g(rectLine(x,y,cx,cy,w,h)/.0055));
  for(const [cx,cy,r] of [[.13,.37,.11],[.74,.30,.12],[.41,.85,.13],[.91,.57,.11]]){
   const dx=(x-cx)*1.5,dy=y-cy,angle=Math.atan2(dy,dx),dist=Math.hypot(dx,dy),edge=r*(.57+.43*Math.cos(angle*5+.3));
   if(dist<edge){const t=dist/Math.max(.001,edge);v=Math.max(v,.39+.44*t+.09*Math.cos(angle*10)*t);}
   v=Math.max(v,.30+.34*g((x-cx-.035*Math.sin((y-cy)*12))/.004)*g((y-cy-.11)/.24));
  }
  break;
 }
 case "layeredArches":{v=.35+wash;for(let i=0;i<4;i++){const rx=.43-i*.085,d=archDistance(x,y,.5,rx,.08+i*.11,.48+i*.018);if(d<.018)v=.72-i*.07;else if(d<.035)v=Math.max(v,.51+i*.05);}break;}
 case "galleryArc":{const a=Math.atan2(y-.94,(x-.5)*1.5),r=Math.hypot(y-.94,(x-.5)*1.5);v=.39+wash;if(r<.92)v+=.33*g(Math.sin(a*11)/.12)+.10*g((r-.67)/.018);break;}
 case "sunDisc":v=.53+.13*Math.sin(x*3+y*9)+.08*Math.sin(x*11-y*5)+.06*Math.sin(y*42+Math.sin(x*8)*2);break;
 case "arch":{const d=archDistance(x,y,.48,.23,.12,.48),inside=y<.48?Math.hypot((x-.48)/.23,(y-.48)/.36)<1:Math.abs(x-.48)<.23;const inner=archDistance(x,y,.48,.145,.28,.50);v=(inside?.44:.33)+wash;if(inside&&inner>.025&&Math.abs(x-.48)<.145&&y>.50)v=.63;const t=y-.63-.20*Math.sin(x*5.3+1);v=Math.max(v,.32+.35*g(t/.11));v=Math.max(v,.33+.48*g(d/.006),.32+.41*g((t-.085)/.009));break;}
 case "split":{const t=y-.58-.045*Math.sin(x*4);v=(t>0?.37:.56)+wash+.15*g((t+.18)/.16);v=Math.max(v,.34+.48*g(t/.008),.34+.34*g((t-.026)/.004));break;}
 case "asymmetric":{const a=x+.72*y,b=x-.54*y;v=a<.65?.35:b>.46?.59:.47;v+=wash;v=Math.max(v,.33+.49*g((a-.65)/.006),.33+.46*g((b-.46)/.006));break;}
 case "mural":{const t=y-.39-.24*Math.sin(x*5.6+.3),u=y-.74+.15*Math.cos(x*5);v=.33+wash+.27*g(t/.17)+.14*g(u/.12)+.035*Math.sin(t*145+x*9)*g(t/.21);v=Math.max(v,.34+.42*g((t+.10)/.007),.34+.41*g((u-.08)/.006));break;}
 case "scallop":{const a=Math.hypot((x+.11)*1.5,y-.89),b=Math.hypot((x-1.13)*1.5,y-.13);v=a<.76?.55:b<.72?.62:.36;v+=wash;v=Math.max(v,.33+.49*g((a-.76)/.008),.33+.40*g((b-.72)/.008),.33+.33*g((a-.60)/.006));break;}
 case "steppedColourBlock":{const a=x+.33*y,b=y-.12*Math.floor(x*4);v=b>.52?.35:a>.67?.58:.44;v+=wash;v=Math.max(v,.34+.42*g((b-.52)/.008),.34+.40*g((a-.67)/.006));break;}
 case "modernRibbons":{const t=y-.30-.23*Math.sin(x*4.7+.4),u=y-.76+.18*Math.cos(x*4);v=.33+wash+.28*g(t/.11)+.18*g(u/.13)+.025*Math.cos(t*190+x*13)*g(t/.12);v=Math.max(v,.33+.49*g((t-.085)/.007),.33+.45*g((u+.09)/.007));break;}
 case "offsetCircles":{const a=Math.hypot((x-.27)*1.5,y-.40),b=Math.hypot((x-.74)*1.5,y-.57),d=x+.64*y;v=.33+wash+(a<.39?.17:0)+(b<.36?.13:0);v=Math.max(v,.34+.48*g((a-.39)/.007),.34+.44*g((b-.36)/.007),.34+.39*g((d-.79)/.006));break;}
 case "facets":{const a=x+.75*y,b=x-.85*y,r=Math.hypot((x-.67)*1.5,y-.49);v=(a<.62?.34:b>.28?.57:.43)+wash;if(r<.36)v+=.08;v=Math.max(v,.33+.49*g((a-.62)/.006),.33+.47*g((b-.28)/.006),.33+.48*g((r-.36)/.007),.33+.39*g((x-.78)/.004));break;}
 case "grid":{v=.35+wash;for(const [cx,cy,w,h] of [[.22,.29,.38,.49],[.62,.57,.49,.65],[.82,.23,.25,.37]])v=Math.max(v,.34+.48*g(rectLine(x,y,cx,cy,w,h)/.005));v+=.035*g((x-.48)/.23);break;}
 case "diagonal":{const t=x+.72*y;v=.35+wash+.21*g((t-.47)/.11)+.25*g((t-1.18)/.12);v=Math.max(v,.34+.48*g((t-.36)/.006),.34+.45*g((t-.59)/.006),.34+.46*g((t-1.30)/.006));break;}
 case "panels":{v=.35+wash;for(const [cx,w,h] of [[.22,.32,.76],[.67,.47,.61],[.84,.19,.85]])v=Math.max(v,.33+.48*g(rectLine(x,y,cx,.49,w,h)/.005));break;}
 case "bands":{v=.35+.18*g((x-.28)/.20)+.13*g((x-.75)/.17)+wash;for(const a of [.13,.16,.19,.70,.73,.76])v=Math.max(v,.33+.42*g((x-a)/.004));break;}
 case "herringbone":{const t=y-.65*Math.abs(x-.5);v=.35+wash+.055*Math.cos(t*10);for(let i=-2;i<6;i++)v=Math.max(v,.34+.46*g((t-i*.21)/.006));break;}
 case "hexGrid":
 case "angularWeave":{const cube=key==="angularWeave",r=cube?.114:.092,xx=x*1.5,yy=y,row=Math.round(yy/(1.5*r));v=.34+wash;let dist=1;for(let j=row-1;j<=row+1;j++){const cy=j*1.5*r,step=Math.sqrt(3)*r,cx0=(j%2)*step/2,col=Math.round((xx-cx0)/step);for(let i=col-1;i<=col+1;i++){const cx=cx0+i*step,dx=Math.abs(xx-cx),dy=Math.abs(yy-cy);dist=Math.min(dist,Math.abs(Math.max(dx*Math.sqrt(3)/2+dy*.5,dy)-r));if(cube&&dx<step*.50&&dy<r)dist=Math.min(dist,line(xx,yy,cx,cy,cx,cy+r),line(xx,yy,cx,cy,cx-step/2,cy-r/2),line(xx,yy,cx,cy,cx+step/2,cy-r/2));}}v=Math.max(v,.33+.47*g(dist/.0045));break;}
 case "sculptDiamond":{const fold=x+.18*Math.sin(y*4);v=.48+.25*Math.sin(fold*19)+.08*Math.sin(fold*38+.5);break;}
 case "sculptPrism":{const fold=y+.19*Math.cos(x*5);v=.48+.26*Math.cos(fold*17)+.09*Math.sin(fold*31);break;}
 }
 return clamp(v+grain);
}
