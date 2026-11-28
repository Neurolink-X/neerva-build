import type {Pattern} from "./wall-patterns.ts";
// Original optical material artwork, not a photograph or physical relief.
export const premiumRasterNames={
 sunDisc:"Gilded mineral strata",layeredArches:"Travertine vault relief",abstractLeaves:"Sculpted silk petals",eclipse:"Midnight onyx veins",aurora:"Brushed champagne waves",galleryArc:"Art deco brass fan",celestial:"Celestial plaster relief",
 floralScroll:"Magnolia garden fresco",bamboo:"Bamboo grove in mist",botanical:"Tropical leaf fresco",forest:"Misty woodland panorama",mountain:"Alpine panorama",waterflow:"Waterfall silk mural",fernStencil:"Fern canopy botanical",
 arch:"Contemporary fluted arch",split:"Bronze and limestone dado",asymmetric:"Asymmetric stone inlay",mural:"Organic plaster contours",scallop:"Ceramic fan relief",steppedColourBlock:"Architectural stepped relief",modernRibbons:"Satin ribbon sculpture",offsetCircles:"Terrazzo medallion inlay",
 facets:"Continuous faceted geometry",grid:"Bevelled stone mosaic",diagonal:"Diagonal brass inlay",panels:"Modern inset panelling",bands:"Fine reeded timber effect"
} as const satisfies Partial<Record<Pattern,string>>;
export type PremiumRasterPattern=keyof typeof premiumRasterNames;
export function isPremiumRaster(key:Pattern):key is PremiumRasterPattern{return Object.hasOwn(premiumRasterNames,key);}
const clamp=(v:number)=>Math.max(0,Math.min(1,v)),fract=(x:number)=>x-Math.floor(x);
const ridge=(x:number)=>Math.pow(.5+.5*Math.cos(x*Math.PI*2),4);
const gaussian=(x:number)=>Math.exp(-x*x);
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t)};
const noise=(x:number,y:number)=>Math.sin(x*39+y*17)*Math.sin(y*31-x*9)*.025+Math.sin(x*91-y*53)*.012;
function plant(x:number,y:number,kind:number){
 let v=.73-.16*y+.065*Math.sin(x*5+y*3);
 for(let i=0;i<6;i++){
  const cx=.05+i*.18+.045*Math.sin(i*4),stem=cx+.055*Math.sin(y*3+i);
  if(Math.abs(x-stem)<.006+(kind===1?.008:0))v=Math.min(v,.29+.12*Math.sin(y*52));
  const j=Math.min(5,Math.max(0,Math.round((y-.10)/.155))),cy=.10+j*.155,dir=(i+j)%2?1:-1;
  const dx=x-cx-.05*dir-.035*Math.sin(cy*3+i),dy=y-cy;
  const d=((dx+dy*dir*.45)/(kind===2?.075:kind===0?.045:.033))**2+(dy/(kind===2?.13:.07))**2;
  if(d<1)v=.32+.19*(1-d)+.09*Math.sin(dx*85)+.035*Math.cos(y*125)+(kind===0&&j%2===0?.25:0);
 }return v;
}
function landscape(x:number,y:number,kind:number){
 let v=.84-.20*y+.035*Math.cos(x*6);
 for(let i=0;i<5;i++){
  const rough=kind===1?.12:.055,edge=.28+i*.137+rough*Math.sin(x*(kind===1?12:6)+i*.8)+rough*.29*Math.sin(x*25+i*2);
  if(y>=edge)v=.70-i*.09+.13*Math.exp(-(y-edge)*17)+.035*Math.sin(x*27+y*13+i);
 }
 if(kind===0){for(let i=0;i<14;i++){const cx=i/13+.02*Math.sin(i*11),top=.25+.22*fract(Math.sin(i*43)*987);if(y>top&&Math.abs(x-cx)<(.025+.018*(i%3))*(y-top)*3)v=Math.min(v,.28+.23*(1-y)+.09*Math.cos((x-cx)*90));}}
 if(kind===2)v+=.32*gaussian((x-.53-.14*Math.sin(y*5))/.085)*(.75+.25*Math.sin(y*65+x*17));
 return v;
}
export function premiumRasterShade(key:PremiumRasterPattern,x:number,y:number){
 let v=.5;
 switch(key){
 case "sunDisc":v=.42+.22*Math.sin(y*19+3*Math.sin(x*6))+.22*ridge(y*6+.3*Math.sin(x*8));break;
 case "layeredArches":{const a=Math.hypot((fract(x*2)-.5)*1.6,Math.max(0,.55-y));v=.37+.32*Math.cos(a*32)+.10*ridge(x*22);break;}
 case "abstractLeaves":{v=.68;for(let i=0;i<5;i++){const dx=x-.12-i*.19,dy=y-.48-.09*Math.sin(i*2),d=((dx+dy*(i%2?.25:-.25))/.12)**2+(dy/.55)**2;if(d<1)v=.29+.46*Math.sqrt(1-d)+.08*Math.sin(d*28);}break;}
 case "eclipse":{const t=x*3+y*2+.16*Math.sin(y*17)+.08*Math.sin(x*41+y*29);v=.22+.42*ridge(t)+.18*ridge(t*2.7+.1);break;}
 case "aurora":v=.48+.24*Math.sin(y*17+4*Math.sin(x*4))+.15*ridge(y*9+.5*Math.sin(x*7));break;
 case "galleryArc":{const u=fract(x*4+(Math.floor(y*4)%2)*.5)-.5,t=fract(y*4),a=Math.atan2(u,t+.05);v=.31+.39*ridge(a*5)+.12*ridge(Math.hypot(u,t)*4);break;}
 case "celestial":{const d=Math.hypot((x-.64)*1.5,y-.33);v=.34+.35*gaussian((d-.23)/.055)+.22*gaussian((d-.36)/.025)+.12*ridge(y*5+x*2);break;}
 case "floralScroll":v=plant(x,y,0);break;
 case "bamboo":v=plant(x,y,1);break;
 case "botanical":v=plant(x,y,2);break;
 case "forest":v=landscape(x,y,0);break;
 case "mountain":v=landscape(x,y,1);break;
 case "waterflow":v=landscape(x,y,2);break;
 case "fernStencil":{v=.76-.13*y;for(let i=0;i<5;i++){const cx=.09+i*.21+.04*Math.sin(y*4+i),cy=Math.round((y-.04)/.087)*.087+.04,s=.055*(.6+.4*Math.sin(cy*3));if(Math.abs(x-cx)<.004)v=.26;for(const dir of [-1,1]){const d=((x-cx-dir*s+(y-cy)*dir*.45)/s)**2+((y-cy)/.019)**2;if(d<1)v=.33+.28*(1-d);}}break;}
 case "arch":{const a=Math.hypot((x-.5)*1.5,Math.max(0,.47-y));v=a<.43?.32+.39*ridge(x*28):.74-.18*ridge(a*8);break;}
 case "split":v=(y>.56?.35+.22*ridge(x*22):.76+.08*Math.sin(x*9+y*4))+.30*gaussian((y-.55)/.013);break;
 case "asymmetric":{const t=x+.27*y+.16*Math.sin(y*3),d=Math.abs(fract(t*3)-.5);v=.31+.30*(Math.floor(t*3)%2)+.30*gaussian(d*30);break;}
 case "mural":{const t=x*3+y*2+.55*Math.sin(y*5);v=.38+.27*Math.cos(t*6)+.12*ridge(t*3);break;}
 case "scallop":{const u=fract(x*6+(Math.floor(y*5)%2)*.5)-.5,t=fract(y*5),d=Math.hypot(u,t-.8);v=.36+.37*ridge(d*5)+.11*Math.cos(u*7);break;}
 case "steppedColourBlock":{const n=Math.floor(x*6),t=y-(.17+n*.12);v=(t>0?.34+.13*(n%3):.72)+.22*Math.exp(-Math.abs(t)*60);break;}
 case "modernRibbons":{const t=x*5+.75*Math.sin(y*6+x);v=.35+.34*Math.sin(t*6)+.19*ridge(t*2);break;}
 case "offsetCircles":{const u=fract(x*4)-.5,t=fract(y*3)-.5,d=Math.hypot(u,t);v=.60-.26*smooth((.41-d)*45)+.21*ridge(d*6);break;}
 case "facets":{const a=fract(x*7+y*4),b=fract(x*7-y*4);v=.26+.58*Math.max(0,1-Math.abs(a-.5)*2-Math.abs(b-.5)*2);break;}
 case "grid":{const a=fract(x*7),b=fract(y*5),d=Math.min(a,1-a,b,1-b);v=.32+.39*smooth(d*14)+.14*Math.exp(-Math.abs(d-.12)*35)+.05*Math.sin(Math.floor(x*7)*7+Math.floor(y*5));break;}
 case "diagonal":{const t=fract(x*5+y*4);v=.32+.24*smooth(t*3)+.30*gaussian((t-.12)/.035);break;}
 case "panels":{const a=fract(x*3),b=y,d=Math.min(a,1-a,b,1-b);v=.51+.23*Math.cos(d*48)*Math.exp(-d*5)+.12*smooth(d*10);break;}
 case "bands":v=.32+.46*ridge(x*32)+.045*Math.sin(y*86+x*23);break;
 }
 return clamp(v+noise(x,y));
}
