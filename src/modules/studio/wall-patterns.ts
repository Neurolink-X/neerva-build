import {decorativeArt,luxuryLattice} from "./decorative-wall-art.ts";
// Coordinates are fractions of the selected wall, clockwise from its top-left corner.
type Point = [number, number];
export type Motif = {points: Point[]; filled?: boolean; alpha?: number; weight?: number};
const line = (...points: Point[]): Motif => ({points});
const box = (x:number,y:number,w:number,h:number) => line([x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]);
const repeat = (count:number,make:(i:number)=>Motif) => Array.from({length:count},(_,i)=>make(i));

// Deterministic procedural finishes, no external assets.
const wave=(y:number,amp:number,phase:number,alpha=.5,weight=1):Motif=>({points:Array.from({length:49},(_,i):Point=>{const x=i/48;return [x,y+amp*Math.sin(x*7+phase)+amp*.25*Math.sin(x*19+phase)]}),alpha,weight});
const leaf=(x:number,y:number,s:number,side:number):Motif=>({filled:true,alpha:.7,points:Array.from({length:25},(_,i):Point=>{const t=i/24*Math.PI*2;return [x+side*s*(.5-.5*Math.cos(t))+.018*Math.sin(t),y-s*.65*(.5-.5*Math.cos(t))+.027*Math.sin(t)]})});
const grain=(count:number,seed:number):Motif[]=>Array.from({length:count},(_,i)=>{const x=((i*73+seed*13)%997)/997,y=((i*137+seed*19)%991)/991;return {points:[[x,y],[Math.min(1,x+.012+(i%5)*.006),Math.min(1,y+.004)]] as Point[],alpha:.14+(i%4)*.06,weight:.45+(i%3)*.25};});
export const finishes = {
 plain: {name:"Plain paint", motifs:[] as Motif[]},
 bands: {name:"Pinstripes", motifs:repeat(12,i=>({...line([(i+.5)/12,0],[(i+.5)/12,1]),alpha:i%3===0?.62:.23,weight:i%3===0?1.3:.55}))},
 diamonds: {name:"Diamond lattice", motifs:luxuryLattice},
 grid: {name:"Square grid", motifs:[...repeat(5,i=>line([(i+1)/6,0],[(i+1)/6,1])),...repeat(3,i=>line([0,(i+1)/4],[1,(i+1)/4]))]},
 panels: {name:"Framed boxes", motifs:repeat(3,i=>box(.035+i/3,.12,.263,.76))},
 inset: {name:"Double panels", motifs:repeat(3,i=>box(.025+i/3,.1,.28,.8)).concat(repeat(3,i=>box(.045+i/3,.14,.24,.72)))},
 facets: {name:"Geometric tape", motifs:[line([0,.22],[.28,.51],[.55,0]),line([.1,0],[.18,.40],[0,.81]),line([.28,.51],[.38,1]),line([.12,1],[.64,.21],[1,.57]),line([.72,0],[.64,.21],[.86,1]),line([.48,.49],[.71,.77],[1,.63])]},
 arch: {name:"Painted arch",motifs:[{filled:true,points:[[.2,1],...Array.from({length:33},(_,i):Point=>{
  const angle=Math.PI+i*Math.PI/32;return [.5+.3*Math.cos(angle),.48+.42*Math.sin(angle)];
 }),[.8,1]] as Point[]}]},
 split: {name:"Two-tone dado", motifs:[{filled:true,points:[[0,.56],[1,.56],[1,1],[0,1]] as Point[]}]},
 diagonal: {name:"Diagonal block", motifs:[{filled:true,points:[[0,0],[.24,0],[.82,1],[0,1]] as Point[]}]},
 marble: {name:"Soft marble veining",motifs:[...repeat(8,i=>wave(.08+i*.12,.07,i*.8,.32,.65)),...repeat(5,i=>wave(.15+i*.18,.09,i*1.4,.15,2.4))]},
 limewash: {name:"Cloud limewash",motifs:repeat(26,i=>wave(.025+i*.038,.027,i*1.17,.09,5))},
 travertine: {name:"Travertine-inspired",motifs:[...repeat(22,i=>wave((i+.5)/22,.008,i*.5,.2,1.3)),...grain(75,4)]},
 linen: {name:"Woven linen",motifs:[...repeat(28,i=>({...line([(i+.5)/28,0],[(i+.5)/28,1]),alpha:.2,weight:.45})),...repeat(22,i=>({...line([0,(i+.5)/22],[1,(i+.5)/22]),alpha:.14,weight:.45}))]},
 botanical: {name:"Botanical silhouettes",motifs:[...repeat(3,i=>({...line([.2+i*.3,1],[.18+i*.3,.72],[.24+i*.3,.4]),alpha:.35,weight:1.1})),...Array.from({length:3},(_,i)=>Array.from({length:4},(_,j)=>({...leaf(.2+i*.3,.94-j*.13,.12,j%2?1:-1),alpha:.32}))).flat()]},
 terracotta: {name:"Earthwashed plaster",motifs:[...repeat(18,i=>wave(.04+i*.055,.045,i*.9,.16,4)),...grain(52,5)]},
 mineral: {name:"Sandstone mineral finish",motifs:[...grain(120,9),...repeat(10,i=>wave(.06+i*.095,.014,i*.65,.12,2.1))]},
 fluted: {name:"Fluted wall effect",motifs:repeat(18,i=>({...line([(i+.5)/18,0],[(i+.5)/18,1]),alpha:i%2?.25:.6,weight:i%2?2:3}))},
 mural: {name:"Horizon mural",motifs:[{filled:true,alpha:.24,points:[[0,1],[0,.65],...Array.from({length:41},(_,i):Point=>[i/40,.6+.09*Math.sin(i/40*8)]),[1,1]] as Point[]},{filled:true,alpha:.48,points:[[0,1],[0,.82],...Array.from({length:41},(_,i):Point=>[i/40,.76+.075*Math.sin(i/40*9+1.5)]),[1,1]] as Point[]}]},
 brushed: {name:"Brushed silk effect",motifs:[...repeat(24,i=>wave((i+.5)/24,.012,i*.9,.14,2.8)),...grain(55,7)]},
 waterflow:{name:"Water flow from bottom",motifs:[...repeat(5,i=>({filled:true,alpha:.12+i*.035,points:[[0,1],...Array.from({length:49},(_,j):Point=>[j/48,.48+i*.09+.10*Math.sin(j/48*7+i*.48)]),[1,1]]})),...repeat(4,i=>wave(.61+i*.09,.04,i*.7,.18,1.1))]},
 slimframes:{name:"Slim architectural moulding",motifs:repeat(3,i=>({...box(.04+i/3,.10,.253,.80),weight:1.6,alpha:.62}))},
 asymmetric:{name:"Offset architectural panels",motifs:[{...box(.055,.08,.32,.84),alpha:.65,weight:1.6},{...box(.405,.08,.54,.32),alpha:.45,weight:1.2},{...box(.405,.45,.54,.47),alpha:.65,weight:1.6}]},
 ribbed:{name:"Soft shadow grooves",motifs:repeat(16,i=>({...line([(i+.5)/16,.08],[(i+.5)/16,.92]),alpha:i%2?.18:.48,weight:i%2?.7:1.8}))},
 stonewash:{name:"Soft stone wash",motifs:[...repeat(24,i=>wave(.02+i*.041,.032,i*.89,.09,4.8)),...grain(60,11)]},
 heritage:{name:"Heritage border accent",motifs:[{...line([0,.13],[1,.13]),alpha:.7,weight:1.4},{...line([0,.87],[1,.87]),alpha:.7,weight:1.4},...repeat(10,i=>({...line([i/10,.13],[(i+.5)/10,.06],[(i+1)/10,.13]),alpha:.45,weight:.8}))]},
 venetian:{name:"Venetian polished plaster",motifs:repeat(9,i=>wave(.08+i*.10,.03,i*.87,.18,4))},
 onyx:{name:"Honed onyx veining",motifs:repeat(7,i=>wave(.12+i*.13,.12,i*.9,.24,1.7))},
 suede:{name:"Soft suede finish",motifs:grain(88,31)},
 microcement:{name:"Seamless microcement",motifs:grain(95,37)},
 reception:{name:"Reception feature wall",motifs:[{...box(.08,.10,.84,.80),alpha:.55,weight:1.6},...repeat(8,i=>({...line([.10+i*.033,.12],[.10+i*.033,.88]),alpha:.35,weight:1.4})),...repeat(8,i=>({...line([.66+i*.033,.12],[.66+i*.033,.88]),alpha:.35,weight:1.4}))]}
 ,herringbone:{name:"Chevron herringbone",motifs:repeat(6,i=>({...line([0,i/6],[.25,(i+.5)/6],[.5,i/6],[.75,(i+.5)/6],[1,i/6]),alpha:.68,weight:1.5}))},...decorativeArt
} satisfies Record<string,{name:string;motifs:Motif[]}>;
export type Pattern = keyof typeof finishes;
export const patternKeys = Object.keys(finishes) as Pattern[];
// Old IDs remain valid for previously selected walls; weak filler designs are
// excluded from the new curated chooser rather than breaking restored selections.
export const retiredPatterns=["travertine","mineral"] as const satisfies readonly Pattern[];
export const patternGroups={
 Signature:["sunDisc","orbit","layeredArches","abstractLeaves","marble","eclipse"],
 Nature:["floralScroll","bamboo","botanical","forest","mountain","waterflow"],
 Classic:["diamonds","inset","heritage","decoFan"],
 Modern:["arch","split","asymmetric","mural","scallop"],
 Geometry:["facets","herringbone","grid","diagonal","panels","bands"],
 Textures:["limewash","linen","terracotta","brushed","stonewash"],
 Artisan:["venetian","onyx","suede","microcement"],
 Architectural:["fluted","ribbed","slimframes","reception"]
} as const satisfies Record<string,readonly Pattern[]>;
export type PatternGroup=keyof typeof patternGroups;
export function groupForPattern(pattern:Pattern):PatternGroup{return (Object.keys(patternGroups) as PatternGroup[]).find(g=>(patternGroups[g] as readonly Pattern[]).includes(pattern))??"Signature";}
export function isRetiredPattern(pattern:Pattern){return (retiredPatterns as readonly Pattern[]).includes(pattern);}
