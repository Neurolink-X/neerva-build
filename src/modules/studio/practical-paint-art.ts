import type {Pattern} from "./wall-patterns.ts";
/** Paintable full-wall compositions, no grout, panel seams or physical tile geometry. */
export const practicalPaintNames={
 eclipse:"Metallic floral frames",layeredArches:"Layered painted arches",galleryArc:"Art deco painted fan",sunDisc:"Brushed mineral wash",
 arch:"Soft painted arch",split:"Two-tone metallic dado",asymmetric:"Asymmetric colour fields",scallop:"Hand-painted scallop border",
 steppedColourBlock:"Stepped colour accent",modernRibbons:"Flowing brush ribbons",offsetCircles:"Overlapping painted circles",
 facets:"Intersecting metallic lines",grid:"Open rectangular line mural",diagonal:"Diagonal painted ribbons",panels:"Oversized painted frames",bands:"Vertical tonal brushwork",
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
 case "arch":{const d=archDistance(x,y,.5,.34,.12,.53),inside=y<.53?Math.hypot((x-.5)/.34,(y-.53)/.41)<1:Math.abs(x-.5)<.34;v=(inside?.68:.38)+wash+.09*g(d/.018);break;}
 case "split":v=(y>.61?.39:.72)+wash+.18*g((y-.61)/.007);break;
 case "asymmetric":{const a=x+.65*y,b=x-.37*y;v=a<.60?.35:b>.48?.69:.53;v+=wash+.08*g((a-.60)/.009);break;}
 case "scallop":{const u=(x*5-Math.floor(x*5))-.5,edge=.22+.11*Math.sqrt(Math.max(0,1-4*u*u));v=(y<edge?.69:.42)+wash+.10*g((y-edge)/.014);break;}
 case "steppedColourBlock":{const edge=.30+Math.min(3,Math.floor(x*4))*.12;v=(y>edge?.36:.67)+wash;break;}
 case "modernRibbons":{const t=y-.23-.22*Math.sin(x*3.5);v=.38+wash+.28*g(t/.10)+.22*g((t-.31)/.15);break;}
 case "offsetCircles":{const a=Math.hypot((x-.29)*1.5,y-.42),b=Math.hypot((x-.68)*1.5,y-.57);v=.40+wash+(a<.32?.21:0)+(b<.35?.13:0)+.06*g((a-.32)/.012);break;}
 case "facets":{v=.36+wash;const lines=[[0,.12,1,.73],[0,.85,.66,0],[.14,1,1,.26],[.46,0,.98,1],[0,.43,.84,1]];for(const [a,b,c,d] of lines)v=Math.max(v,.35+.47*g(line(x,y,a,b,c,d)/.006));break;}
 case "grid":{v=.37+wash;for(const [cx,cy,w,h] of [[.27,.3,.36,.40],[.66,.57,.48,.54],[.83,.18,.23,.30]])v=Math.max(v,.36+.48*g(rectLine(x,y,cx,cy,w,h)/.006));break;}
 case "diagonal":{const t=x+.65*y;v=.37+wash+.23*g((t-.53)/.11)+.34*g((t-1.18)/.09);break;}
 case "panels":{v=.52+wash;for(const [cx,w] of [[.23,.29],[.75,.37]])v+=.23*g(rectLine(x,y,cx,.51,w,.78)/.006);break;}
 case "bands":v=.52+.15*Math.sin(x*15)+.05*Math.sin(x*74+y*3)+wash;break;
 case "sculptDiamond":{const fold=x+.18*Math.sin(y*4);v=.48+.25*Math.sin(fold*19)+.08*Math.sin(fold*38+.5);break;}
 case "sculptPrism":{const fold=y+.19*Math.cos(x*5);v=.48+.26*Math.cos(fold*17)+.09*Math.sin(fold*31);break;}
 }
 return clamp(v+grain);
}
