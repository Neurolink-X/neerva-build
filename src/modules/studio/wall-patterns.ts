// Coordinates are fractions of the selected wall, clockwise from its top-left corner.
type Point = [number, number];
export type Motif = {points: Point[]; filled?: boolean};
const line = (...points: Point[]): Motif => ({points});
const box = (x:number,y:number,w:number,h:number) => line([x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]);
const repeat = (count:number,make:(i:number)=>Motif) => Array.from({length:count},(_,i)=>make(i));

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
 diagonal: {name:"Diagonal block", motifs:[{filled:true,points:[[0,0],[.24,0],[.82,1],[0,1]] as Point[]}]}
} satisfies Record<string,{name:string;motifs:Motif[]}>;
export type Pattern = keyof typeof finishes;
export const patternKeys = Object.keys(finishes) as Pattern[];
