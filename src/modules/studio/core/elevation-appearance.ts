/** Visual specifications shared by elevation drawings and 3D.
 * They never create structural openings, floor area, or change saved plan IDs. */
export const glazingBayCount=(widthMetres:number)=>Math.max(1,Math.ceil(widthMetres/1.35));
export const elevationProfiles={
 shops:{title:"Contemporary retail frontage",bandFt:.8,frame:[.19,.23,.24],glassOpacity:.32,glassRoughness:.20,bandDepth:.12,trimDepth:.15},
 mall:{title:"Layered urban retail",bandFt:.9,frame:[.15,.19,.22],glassOpacity:.28,glassRoughness:.12,bandDepth:.18,trimDepth:.21},
 restaurant:{title:"Warm hospitality frontage",bandFt:1.05,frame:[.32,.25,.20],glassOpacity:.36,glassRoughness:.24,bandDepth:.14,trimDepth:.17},
 school:{title:"Daylight-oriented institutional frontage",bandFt:.53,frame:[.23,.29,.27],glassOpacity:.40,glassRoughness:.25,bandDepth:.09,trimDepth:.12},
 rental:{title:"Contemporary apartment frontage",bandFt:.65,frame:[.25,.26,.25],glassOpacity:.34,glassRoughness:.19,bandDepth:.11,trimDepth:.14}
} satisfies Record<string,{title:string;bandFt:number;frame:[number,number,number];glassOpacity:number;glassRoughness:number;bandDepth:number;trimDepth:number}>;
/** Keep SVG gradients explicit: default objectBoundingBox coordinates must
 * be percentages or normalized numbers, not pixel lengths. */
export function facadeShade(hex:string,factor:number){
 const safe=/^#[0-9a-f]{6}$/i.test(hex)?hex:"#ddd7c9";
 return "#"+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(safe.slice(i,i+2),16)*factor))).toString(16).padStart(2,"0")).join("");
}
