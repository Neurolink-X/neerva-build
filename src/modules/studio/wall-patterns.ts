import {decorativeArt,luxuryLattice} from "./decorative-wall-art.ts";
import {premiumArt,enrichArtwork} from "./premium-wall-art.ts";
import {refinedArtwork} from "./refined-wall-art.ts";
// Coordinates are fractions of the selected wall, clockwise from its top-left corner.
type Point = [number, number];
export type Motif = {points: Point[]; filled?: boolean; alpha?: number; weight?: number; tone?:number};
const line = (...points: Point[]): Motif => ({points});
const box = (x:number,y:number,w:number,h:number) => line([x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]);
const repeat = (count:number,make:(i:number)=>Motif) => Array.from({length:count},(_,i)=>make(i));

// Deterministic procedural finishes, no external assets.
const wave=(y:number,amp:number,phase:number,alpha=.5,weight=1):Motif=>({points:Array.from({length:49},(_,i):Point=>{const x=i/48;return [x,y+amp*Math.sin(x*7+phase)+amp*.25*Math.sin(x*19+phase)]}),alpha,weight});
const leaf=(x:number,y:number,s:number,side:number):Motif=>({filled:true,alpha:.7,points:Array.from({length:25},(_,i):Point=>{const t=i/24*Math.PI*2;return [x+side*s*(.5-.5*Math.cos(t))+.018*Math.sin(t),y-s*.65*(.5-.5*Math.cos(t))+.027*Math.sin(t)]})});
const grain=(count:number,seed:number):Motif[]=>Array.from({length:count},(_,i)=>{const x=((i*73+seed*13)%997)/997,y=((i*137+seed*19)%991)/991;return {points:[[x,y],[Math.min(1,x+.012+(i%5)*.006),Math.min(1,y+.004)]] as Point[],alpha:.14+(i%4)*.06,weight:.45+(i%3)*.25};});

const polygon=(points:Point[],alpha=.68):Motif=>({points,filled:true,alpha});
const radial=(x:number,y:number,r:number,n:number,phase=0):Point[]=>Array.from({length:n+1},(_,i)=>{const a=i*2*Math.PI/n+phase;return [x+r*Math.cos(a),y+r*Math.sin(a)]});
const rosette=(x:number,y:number,r:number,petals:number):Motif=>({points:Array.from({length:81},(_,i):Point=>{const a=i*Math.PI/40,s=r*(.66+.34*Math.cos(a*petals));return [x+s*Math.cos(a),y+s*Math.sin(a)]}),alpha:.8,weight:1.3});
const prints=(make:(x:number,y:number,i:number)=>Motif[])=>Array.from({length:20},(_,i)=>make(.1+(i%5)*.2,.125+Math.floor(i/5)*.25,i)).flat();
const relief=(x:number,y:number,s:number,flip=false):Motif[]=>[
 polygon([[x,y],[x+s,y],[x+s*.5,y+s*.5]],flip?.22:.85),
 polygon([[x+s,y],[x+s,y+s],[x+s*.5,y+s*.5]],.42),
 polygon([[x+s,y+s],[x,y+s],[x+s*.5,y+s*.5]],flip?.85:.18),
 polygon([[x,y+s],[x,y],[x+s*.5,y+s*.5]],.55)];
const newPaintedArt={
 aurora:{name:"Aurora ribbon mural",motifs:repeat(7,i=>wave(.22+i*.09,.105,i*.34,.3+i*.07,2))},
 galleryArc:{name:"Gallery arc composition",motifs:[...repeat(5,i=>({...line(...radial(.48,.48,.12+i*.075,48,i*.12)),alpha:.18+i*.13,weight:1.4})),polygon(radial(.75,.25,.095,36),.82)]},
 celestial:{name:"Celestial moon mural",motifs:[polygon(radial(.72,.28,.13,48),.78),...repeat(8,i=>({...line([.08+i*.11,.66],[.13+i*.11,.76],[.18+i*.11,.66]),alpha:.4,weight:1.4})),...repeat(9,i=>({...line(...radial(.08+i*.095,.15+(i%3)*.12,.018,4)),alpha:.65}))]},
 lotusPond:{name:"Lotus pond painting",motifs:[...repeat(4,i=>wave(.72+i*.06,.025,i,.55,1.4)),...Array.from({length:4},(_,i)=>Array.from({length:5},(_,j)=>leaf(.14+i*.23,.67-(i%2)*.14,.09,j%2?1:-1))).flat()]},
 desertDunes:{name:"Desert dunes painting",motifs:[polygon(radial(.72,.24,.115,48),.75),...repeat(3,i=>polygon([[0,1],...Array.from({length:49},(_,j):Point=>[j/48,.48+i*.16+.08*Math.sin(j/48*8+i)]),[1,1]],.25+i*.23))]},
 oceanCliffs:{name:"Ocean cliff mural",motifs:[polygon([[0,1],[0,.28],[.18,.35],[.26,.58],[.42,.72],[.38,1]],.8),polygon([[1,1],[1,.47],[.8,.52],[.65,.76],[.62,1]],.52),...repeat(6,i=>wave(.56+i*.065,.025,i,.4,1.5))]},
 citySilhouette:{name:"City skyline painting",motifs:[...repeat(11,i=>polygon([[i/11,.88],[i/11,.35+(i*7%5)*.09],[(i+1)/11,.35+(i*7%5)*.09],[(i+1)/11,.88]],.3+(i%3)*.2)),...repeat(3,i=>wave(.9+i*.035,.012,i,.6,1))]},
 fernStencil:{name:"Fern leaf stencil",motifs:[line([.5,.97],[.49,.12]),...Array.from({length:9},(_,i)=>[leaf(.49,.9-i*.082,.17-i*.011,1),leaf(.49,.9-i*.082,.17-i*.011,-1)]).flat()]},
 blossomBranch:{name:"Blossom branch painting",motifs:[line([0,.9],[.32,.63],[.56,.38],[.9,.12]),...Array.from({length:7},(_,i)=>[line([.15+i*.12,.8-i*.1],[.22+i*.12,.62-i*.075]),rosette(.22+i*.12,.62-i*.075,.055,5)]).flat()]},
 royalRosette:{name:"Royal rosette border",motifs:[...repeat(7,i=>rosette(.08+i*.14,.2,.065,8)),...repeat(7,i=>rosette(.08+i*.14,.8,.065,8)),line([0,.3],[1,.3]),line([0,.7],[1,.7])]},
 jaliMedallion:{name:"Jali medallion stencil",motifs:prints((x,y)=>[rosette(x,y,.075,6),{...line(...radial(x,y,.032,6)),alpha:.5}])},
 ogee:{name:"Classic ogee lattice",motifs:prints((x,y)=>[line([x,y-.12],[x+.08,y-.045],[x+.06,y+.04],[x,y+.12],[x-.06,y+.04],[x-.08,y-.045],[x,y-.12])])},
 modernRibbons:{name:"Interlocking colour ribbons",motifs:[polygon([[0,.05],[.18,0],[.75,1],[.54,1]],.7),polygon([[.56,0],[.79,0],[.26,1],[.04,1]],.38),polygon([[.85,0],[1,0],[1,.5]],.58)]},
 offsetCircles:{name:"Offset circle colour blocks",motifs:[polygon(radial(.21,.32,.23,48),.42),polygon(radial(.53,.56,.28,48),.62),polygon(radial(.84,.28,.14,48),.85)]},
 hexGrid:{name:"Hexagon geometry",motifs:prints((x,y)=>[{...line(...radial(x,y,.1,6,Math.PI/6)),weight:1.5,alpha:.75}])},
 angularWeave:{name:"Angular weave stencil",motifs:prints((x,y,i)=>[polygon(radial(x,y,.1,3,i%2?Math.PI:0),.35),line([x-.1,y],[x,y+.1],[x+.1,y])])},
 printLotus:{name:"Printed lotus repeat",motifs:prints((x,y)=>[rosette(x,y,.08,5),polygon(radial(x,y,.018,12),.85)])},
 printPalm:{name:"Printed palm leaves",motifs:prints((x,y)=>[leaf(x,y+.075,.1,-1),leaf(x,y+.075,.1,1),line([x,y+.095],[x,y-.06])])},
 printTerrazzo:{name:"Printed terrazzo shapes",motifs:prints((x,y,i)=>[polygon(radial(x-.025,y,.043+(i%3)*.01,3+i%3,i),.4+(i%3)*.16),polygon(radial(x+.05,y+.055,.023,5,i),.55)])},
 printScandi:{name:"Printed Nordic crosses",motifs:prints((x,y)=>[polygon([[x-.02,y-.085],[x+.02,y-.085],[x+.02,y-.025],[x+.075,y-.025],[x+.075,y+.025],[x+.02,y+.025],[x+.02,y+.085],[x-.02,y+.085],[x-.02,y+.025],[x-.075,y+.025],[x-.075,y-.025],[x-.02,y-.025]],.72)])},
 printMosaic:{name:"Printed mosaic tiles",motifs:prints((x,y,i)=>[polygon(radial(x,y,.09,4,Math.PI/4),i%2?.75:.25),{...line(...radial(x,y,.045,4)),alpha:.85}])},
 printDots:{name:"Printed dot clusters",motifs:prints((x,y)=>[polygon(radial(x,y,.036,24),.8),polygon(radial(x-.052,y-.05,.016,16),.45),polygon(radial(x+.052,y+.05,.021,16),.6)])},
 printWave:{name:"Printed wave scallops",motifs:prints((x,y)=>[line(...Array.from({length:25},(_,i):Point=>[x-.09+i*.0075,y-.06*Math.sin(i*Math.PI/24)])),line(...Array.from({length:25},(_,i):Point=>[x-.09+i*.0075,y+.04-.05*Math.sin(i*Math.PI/24)]))])},
 printPaisley:{name:"Printed paisley motifs",motifs:prints((x,y)=>[leaf(x-.04,y+.08,.13,1),rosette(x+.03,y-.01,.035,5)])},
 reliefDiamond:{name:"3D diamond illusion",motifs:prints((x,y,i)=>relief(x-.085,y-.085,.17,i%2===0))},
 reliefPyramid:{name:"3D pyramid illusion",motifs:prints((x,y)=>[polygon([[x-.09,y+.09],[x,y-.1],[x,y+.09]],.8),polygon([[x,y-.1],[x+.09,y+.09],[x,y+.09]],.3)])},
 reliefCube:{name:"3D isometric cube",motifs:prints((x,y)=>[polygon([[x,y-.09],[x+.075,y-.045],[x,y],[x-.075,y-.045]],.24),polygon([[x-.075,y-.045],[x,y],[x,y+.09],[x-.075,y+.045]],.82),polygon([[x,y],[x+.075,y-.045],[x+.075,y+.045],[x,y+.09]],.48)])},
 reliefSteps:{name:"3D stepped blocks",motifs:prints((x,y)=>[polygon([[x-.08,y+.07],[x-.08,y-.025],[x,y-.025],[x,y-.08],[x+.08,y-.08],[x+.08,y+.07]],.65),polygon([[x+.08,y-.08],[x+.105,y-.05],[x+.105,y+.09],[x+.08,y+.07]],.24)])},
 reliefFolds:{name:"3D folded paper",motifs:prints((x,y)=>[polygon([[x-.09,y-.09],[x+.09,y-.09],[x-.09,y+.09]],.82),polygon([[x+.09,y-.09],[x+.09,y+.09],[x-.09,y+.09]],.28)])},
 reliefTiles:{name:"3D bevelled tile",motifs:prints((x,y)=>[polygon([[x-.09,y-.09],[x+.09,y-.09],[x+.06,y-.06],[x-.06,y-.06]],.22),polygon([[x+.09,y-.09],[x+.09,y+.09],[x+.06,y+.06],[x+.06,y-.06]],.8),polygon([[x-.09,y+.09],[x+.09,y+.09],[x+.06,y+.06],[x-.06,y+.06]],.66),polygon([[x-.09,y-.09],[x-.06,y-.06],[x-.06,y+.06],[x-.09,y+.09]],.38)])},
 reliefRibbon:{name:"3D woven ribbon",motifs:prints((x,y)=>[polygon([[x-.1,y-.05],[x+.1,y-.05],[x+.1,y],[x-.1,y]],.65),polygon([[x-.05,y-.1],[x,y-.1],[x,y+.1],[x-.05,y+.1]],.32),polygon([[x-.05,y],[x,y],[x,y+.05],[x-.05,y+.05]],.82)])},
 reliefChevron:{name:"3D chevron panels",motifs:prints((x,y)=>[polygon([[x-.1,y-.08],[x,y],[x+.1,y-.08],[x+.1,y],[x,y+.08],[x-.1,y]],.65),polygon([[x,y],[x+.1,y-.08],[x+.1,y],[x,y+.08]],.28)])},
 archNiches:{name:"Painted arch niches",motifs:repeat(4,i=>({...line([.04+i*.24,.9],[.04+i*.24,.36],...radial(.14+i*.24,.36,.10,32).slice(16,33),[.24+i*.24,.9]),alpha:.8,weight:1.5}))},
 shakerPanels:{name:"Painted shaker panels",motifs:[...repeat(4,i=>box(.035+i*.24,.08,.21,.53)),...repeat(4,i=>box(.035+i*.24,.68,.21,.24))]},
 pilasterLines:{name:"Painted pilaster accents",motifs:[...repeat(5,i=>polygon([[.05+i*.19,.06],[.09+i*.19,.06],[.09+i*.19,.94],[.05+i*.19,.94]],.45)),line([0,.06],[1,.06]),line([0,.94],[1,.94])]},
 steppedFrames:{name:"Stepped feature frames",motifs:repeat(4,i=>({...box(.06+i*.045,.1+i*.07,.88-i*.09,.8-i*.14),alpha:.25+i*.18,weight:1.4}))}
} satisfies Record<string,{name:string;motifs:Motif[]}>;

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
 ,herringbone:{name:"Chevron herringbone",motifs:repeat(6,i=>({...line([0,i/6],[.25,(i+.5)/6],[.5,i/6],[.75,(i+.5)/6],[1,i/6]),alpha:.68,weight:1.5}))},artDecoSunburst:{name:"Art deco sunburst",motifs:repeat(15,i=>({...line([.5,.8],[.5+.46*Math.cos(Math.PI+i*Math.PI/14),.8+.64*Math.sin(Math.PI+i*Math.PI/14)]),alpha:.55,weight:1.3}))},
  steppedColourBlock:{name:"Stepped colour block",motifs:[{filled:true,alpha:.74,points:[[0,1],[0,.45],[.32,.45],[.32,.62],[.65,.62],[.65,.8],[1,.8],[1,1]] as Point[]}]},
  softConcrete:{name:"Fine concrete patina",motifs:[...grain(64,43),...repeat(14,i=>wave(.04+i*.07,.018,i*.91,.10,3))]},...decorativeArt,...newPaintedArt,...premiumArt
} satisfies Record<string,{name:string;motifs:Motif[]}>;
export type Pattern = keyof typeof finishes;
export const patternKeys = Object.keys(finishes) as Pattern[];
// Old IDs remain valid for previously selected walls; weak filler designs are
// excluded from the new curated chooser rather than breaking restored selections.
export const patternGroups={
 "Signature": [
  "orbit",
  "layeredArches",
  "sunDisc",
  "aurora"
 ],
 "Murals": [
  "riverSunset",
  "lotusPond",
  "flyingBirds",
  "gardenTree"
 ],
 "Nature": [
  "floralScroll",
  "bamboo",
  "forest",
  "blossomBranch"
 ],
 "Classic": [
  "diamonds",
  "decoFan",
  "jaliMedallion",
  "heritage"
 ],
 "Modern": [
  "arch",
  "split",
  "modernRibbons",
  "offsetCircles"
 ],
 "Geometry": [
  "facets",
  "herringbone",
  "hexGrid",
  "angularWeave"
 ],
 "Printed": [
  "silkBotanical",
  "imperialVine",
  "decoInlay",
  "moroccanFiligree"
 ],
 "3D effects": [
  "sculptWave",
  "sculptRibbon",
  "sculptFold",
  "sculptStone"
 ],
 "Architectural": [
  "atelierPanel",
  "regencyPanel",
  "grandSalon",
  "archGallery"
 ]
} as const satisfies Record<string,readonly Pattern[]>;
const curated=new Set<Pattern>(Object.values(patternGroups).flat());
export const retiredPatterns=patternKeys.filter(key=>key!=="plain"&&!curated.has(key));
export type PatternGroup=keyof typeof patternGroups;
export function groupForPattern(pattern:Pattern):PatternGroup{return (Object.keys(patternGroups) as PatternGroup[]).find(g=>(patternGroups[g] as readonly Pattern[]).includes(pattern))??"Signature";}
export function isRetiredPattern(pattern:Pattern){return (retiredPatterns as readonly Pattern[]).includes(pattern);}

// Upgrade visible artwork without duplicating assets or changing saved legacy IDs.
const motifCache=new Map<Pattern,Motif[]>();
export function artworkMotifs(key:Pattern):Motif[]{
 const cached=motifCache.get(key);if(cached)return cached;
 const motifs=refinedArtwork[key]??((Object.hasOwn(premiumArt,key)||isRetiredPattern(key)||key==="plain")?finishes[key].motifs:enrichArtwork(key,finishes[key].motifs));
 if(motifCache.size>=16){const first=motifCache.keys().next().value;if(first!==undefined)motifCache.delete(first);}
 motifCache.set(key,motifs);return motifs;
}
