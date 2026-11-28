import type {Motif} from "./wall-patterns.ts";
type P=[number,number];
const rect=(x:number,y:number,w:number,h:number):P[]=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const fill=(points:P[],tone=0,pigment=.8):Motif=>({points,filled:true,tone,pigment,finish:"matte",alpha:.94});
const line=(points:P[],tone=.4,weight=.65):Motif=>({points,tone,weight,pigment:.85,alpha:.9});
const seq=<T>(n:number,f:(i:number)=>T)=>Array.from({length:n},(_,i)=>f(i));
const band=(x:number,y:number,w:number,h:number,tone:number)=>[fill(rect(x,y,w,h),tone),line([[x,y],[x+w,y]],.43,.65)];
const entry=(name:string,motifs:Motif[])=>({name,motifs});
/** Exterior paint studies: original low-cost vector finishes, no interior
 * mural/metallic relief or false claims of physical cladding. */
export const exteriorArt={
 facadeTwoTone:entry("Contemporary two-tone elevation",[...band(0,.68,1,.32,-.24),...band(0,.62,1,.055,.32)]),
 facadeAccentPier:entry("Vertical accent pier",[...band(.68,0,.32,1,-.28),...band(.65,0,.025,1,.47)]),
 facadeCornerWrap:entry("Modern corner colour block",[fill([[0,0],[.34,0],[.34,.72],[1,.72],[1,1],[0,1]],-.24),line([[.34,0],[.34,.72],[1,.72]],.48,1)]),
 facadeHorizontalBands:entry("Horizontal elevation bands",seq(4,i=>band(0,.12+i*.235,1,.07,i%2?-.19:.20)).flat()),
 facadeFineGrooves:entry("Fine horizontal groove effect",seq(10,i=>[line([[0,(i+.5)/10],[1,(i+.5)/10]],-.32,.8),line([[0,(i+.5)/10+.009],[1,(i+.5)/10+.009]],.42,.5)]).flat()),
 facadeAshlar:entry("Rectangular stone-block effect",seq(6,r=>seq(5,c=>{const x=c*.25-(r%2?.125:0),y=r/6;return [fill(rect(x+.004,y+.006,.242,1/6-.012),((c*3+r)%5-2)*.12,.64),line([[x,y],[x+.25,y],[x+.25,y+1/6]],-.36,.56)];}).flat()).flat()),
 facadeSandstone:entry("Sandstone-toned bands",seq(12,i=>[fill(rect(0,i/12,1,1/12-.004),((i*7)%5-2)*.085,.64),line([[0,i/12],[1,i/12]],.34,.48)]).flat()),
 facadePlaster:entry("Subtle exterior plaster",seq(100,i=>{const x=(i*37%101)/100,y=(i*61%103)/102;return fill(rect(x,y,.012+(i%4)*.004,.003+(i%3)*.002),i%2?.22:-.19,.42)})),
 facadeFrame:entry("Minimal elevation frame",[...band(0,0,1,.09,.32),...band(0,.91,1,.09,.32),fill(rect(0,.09,.075,.82),.32),fill(rect(.925,.09,.075,.82),.32)]),
 facadeRecess:entry("Recessed accent panel effect",[fill(rect(.12,.08,.76,.84),-.24),line([[.12,.92],[.12,.08],[.88,.08]],-.41,1.2),line([[.12,.92],[.88,.92],[.88,.08]],.46,1)]),
 facadeTrim:entry("Classic exterior trim",[...band(0,.04,1,.035,.45),...band(0,.13,1,.04,-.19),...band(0,.86,1,.04,-.19),...band(0,.925,1,.035,.45)]),
 facadePlinth:entry("Raised plinth colour finish",[...band(0,.73,1,.27,-.36),...band(0,.69,1,.04,.27),...seq(5,i=>line([[i/5,.76],[i/5,1]],-.15,.45))])
} satisfies Record<string,{name:string;motifs:Motif[]}>;
export type ExteriorPattern=keyof typeof exteriorArt;
export const exteriorCollections={
 Modern:["facadeTwoTone","facadeAccentPier","facadeCornerWrap"],
 Geometry:["facadeHorizontalBands","facadeFineGrooves","facadeAshlar"],
 Architectural:["facadeFrame","facadeRecess","facadeTrim"],
 Classic:["facadeSandstone","facadePlaster","facadePlinth"]
} as const satisfies Record<string,readonly ExteriorPattern[]>;
export const exteriorGuide={
 Modern:{title:"Modern exterior accents",description:"Two-tone paint, vertical piers and corner colour blocks.",tip:"Keep accents on one elevation section; use exterior-rated paint."},
 Geometry:{title:"Exterior lines and blockwork",description:"Horizontal bands, subtle grooves and stone-block paint effects.",tip:"Align bands with slab levels and opening edges."},
 Architectural:{title:"Elevation detailing",description:"Simple frames, recessed colour fields and exterior trim.",tip:"These are painted concepts, not installed mouldings."},
 Classic:{title:"Exterior material effects",description:"Sandstone-inspired bands, fine plaster and darker plinth colours.",tip:"Use weather-rated finishes; confirm substrate and application with your painter."}
} as const;
export const exteriorPatternKeys=Object.keys(exteriorArt) as ExteriorPattern[];
export function isExteriorPattern(key:string):key is ExteriorPattern{return Object.hasOwn(exteriorArt,key);}
export function exteriorGroupFor(key:string):keyof typeof exteriorCollections{return (Object.keys(exteriorCollections) as (keyof typeof exteriorCollections)[]).find(g=>(exteriorCollections[g] as readonly string[]).includes(key))??"Modern";}
