import {isPracticalPaintArt,practicalPaintShade} from "./practical-paint-art.ts";
import type {Pattern} from "./wall-patterns.ts";
// Original optical material artwork, not a photograph or physical relief.
export const premiumRasterNames={
 sunDisc:"Brushed mineral wash",layeredArches:"Layered painted arches",abstractLeaves:"Sculpted silk petals",eclipse:"Metallic floral frames",aurora:"Brushed champagne waves",galleryArc:"Art deco painted fan",celestial:"Celestial plaster relief",
 floralScroll:"Magnolia garden fresco",bamboo:"Bamboo grove in mist",botanical:"Tropical leaf fresco",forest:"Misty woodland panorama",mountain:"Alpine panorama",waterflow:"Waterfall silk mural",fernStencil:"Fern canopy botanical",
 arch:"Sculpted arch and ribbons",split:"Champagne horizon",asymmetric:"Modern diagonal colour fields",mural:"Silk brush panorama",scallop:"Art deco sweeping curves",steppedColourBlock:"Architectural colour cascade",modernRibbons:"Golden flowing ribbons",offsetCircles:"Celestial intersecting circles",
 facets:"Metallic architectural geometry",grid:"Asymmetric painted frames",diagonal:"Luxury diagonal bands",panels:"Gallery line composition",bands:"Vertical ombre accents"
} as const satisfies Partial<Record<Pattern,string>>;
export type PremiumRasterPattern=keyof typeof premiumRasterNames;
export function isPremiumRaster(key:Pattern):key is PremiumRasterPattern{return Object.hasOwn(premiumRasterNames,key);}
const clamp=(v:number)=>Math.max(0,Math.min(1,v)),fract=(x:number)=>x-Math.floor(x);
const ridge=(x:number)=>Math.pow(.5+.5*Math.cos(x*Math.PI*2),4);
const gaussian=(x:number)=>Math.exp(-x*x);
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
 if(isPracticalPaintArt(key))return practicalPaintShade(key,x,y);
 let v=.5;
 switch(key){
 case "abstractLeaves":{v=.68;for(let i=0;i<5;i++){const dx=x-.12-i*.19,dy=y-.48-.09*Math.sin(i*2),d=((dx+dy*(i%2?.25:-.25))/.12)**2+(dy/.55)**2;if(d<1)v=.29+.46*Math.sqrt(1-d)+.08*Math.sin(d*28);}break;}
 case "aurora":v=.48+.24*Math.sin(y*17+4*Math.sin(x*4))+.15*ridge(y*9+.5*Math.sin(x*7));break;
 case "floralScroll":v=plant(x,y,0);break;
 case "bamboo":v=plant(x,y,1);break;
 case "botanical":v=plant(x,y,2);break;
 case "forest":v=landscape(x,y,0);break;
 case "mountain":v=landscape(x,y,1);break;
 case "waterflow":v=landscape(x,y,2);break;
 case "fernStencil":{v=.76-.13*y;for(let i=0;i<5;i++){const cx=.09+i*.21+.04*Math.sin(y*4+i),cy=Math.round((y-.04)/.087)*.087+.04,s=.055*(.6+.4*Math.sin(cy*3));if(Math.abs(x-cx)<.004)v=.26;for(const dir of [-1,1]){const d=((x-cx-dir*s+(y-cy)*dir*.45)/s)**2+((y-cy)/.019)**2;if(d<1)v=.33+.28*(1-d);}}break;}
 }
 return clamp(v+noise(x,y));
}
