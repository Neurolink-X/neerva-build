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
 bands: {name:"Pinstripes", motifs:repeat(8,i=>line([(i+.5)/8,0],[(i+.5)/8,1]))},
 diamonds: {name:"Diamond lattice", motifs:repeat(13,i=>line([(i-6)/6,0],[i/6,1])).concat(repeat(13,i=>line([i/6,0],[(i-6)/6,1])))},
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
 botanical: {name:"Botanical silhouettes",motifs:[...repeat(4,i=>({...line([.14+i*.24,1],[.12+i*.24,.68],[.16+i*.24,.28]),alpha:.72,weight:1.4})),...Array.from({length:4},(_,i)=>Array.from({length:5},(_,j)=>leaf(.14+i*.24,.91-j*.135,.10,j%2?1:-1))).flat()]},
 terracotta: {name:"Organic clay waves",motifs:repeat(10,i=>wave(.04+i*.1,.045,i*.72,.5,3))},
 mineral: {name:"Mineral speckle",motifs:grain(180,9)},
 fluted: {name:"Fluted wall effect",motifs:repeat(18,i=>({...line([(i+.5)/18,0],[(i+.5)/18,1]),alpha:i%2?.25:.6,weight:i%2?2:3}))},
 mural: {name:"Horizon mural",motifs:[{filled:true,alpha:.24,points:[[0,1],[0,.65],...Array.from({length:41},(_,i):Point=>[i/40,.6+.09*Math.sin(i/40*8)]),[1,1]] as Point[]},{filled:true,alpha:.48,points:[[0,1],[0,.82],...Array.from({length:41},(_,i):Point=>[i/40,.76+.075*Math.sin(i/40*9+1.5)]),[1,1]] as Point[]}]},
 brushed: {name:"Brushed silk effect",motifs:[...repeat(18,i=>wave((i+.5)/18,.018,i*.9,.19,3)),...grain(65,7)]}
} satisfies Record<string,{name:string;motifs:Motif[]}>;
export type Pattern = keyof typeof finishes;
export const patternKeys = Object.keys(finishes) as Pattern[];
export const patternGroups={Signature:["marble","limewash","botanical","fluted","mural","brushed"],Textures:["travertine","linen","mineral","terracotta"],Classic:["bands","diamonds","grid","panels","inset"],Modern:["facets","arch","split","diagonal"]} as const satisfies Record<string,readonly Pattern[]>;
export type PatternGroup=keyof typeof patternGroups;
