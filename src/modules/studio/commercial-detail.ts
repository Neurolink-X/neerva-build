import {elevationProfiles} from "./core/elevation-appearance.ts";
import {overlapArea,type Rect} from "./plan-model.ts";
import {commercialInternalSpaces,commercialInternalOpenings} from "./commercial-internal.ts";
import {rentalLayouts} from "./rental-layout.ts";
import type {BuildingConcept} from "./building-purpose.ts";
import {additionalCommercialGlazing} from "./commercial-ventilation.ts";
export type CommercialFixture=Rect&{id:string;zoneId:string;floor:number;label:string;kind:"desk"|"table"|"display"|"counter"|"bed"|"sofa"};
export type ConceptPortal={id:string;zoneId:string;floor:number;axis:"x"|"y";x:number;y:number;length:number;kind:"access"|"exterior-glazing";reviewRequired:true;connectsTo?:string};
const EPS=1e-5;
export function commercialPortals(plan:BuildingConcept):ConceptPortal[]{
 const result:ConceptPortal[]=[],rentals=rentalLayouts(plan),inside=commercialInternalSpaces(plan),partitioned=new Set(inside.map(r=>r.parentId));
 for(const z of plan.zones.filter(z=>!["parking","open","circulation"].includes(z.kind))){
  if(partitioned.has(z.id))continue;
  const hall=plan.zones.find(h=>h.floor===z.floor&&h.kind==="circulation");if(!hall)continue;
  const right=Math.abs(z.x+z.w-hall.x)<EPS,left=Math.abs(z.x-hall.x-hall.w)<EPS;
  const lo=Math.max(z.y,hall.y),hi=Math.min(z.y+z.d,hall.y+hall.d);
  if((right||left)&&hi-lo>=4){
   const living=rentals.find(u=>u.unitId===z.id)?.rooms.find(r=>r.kind==="living");
   const center=living?living.y+living.d/2:(lo+hi)/2;
   result.push({id:z.id+"-access",zoneId:z.id,floor:z.floor,axis:"y",x:right?z.x+z.w:z.x,y:center-1.5,length:3,kind:"access",reviewRequired:true});
  }
  const above=Math.abs(z.y+z.d-hall.y)<EPS,below=Math.abs(z.y-hall.y-hall.d)<EPS;
  const xlo=Math.max(z.x,hall.x),xhi=Math.min(z.x+z.w,hall.x+hall.w);
  if((above||below)&&xhi-xlo>=4)result.push({id:z.id+"-access",zoneId:z.id,floor:z.floor,axis:"x",x:(xlo+xhi)/2-1.5,y:above?z.y+z.d:z.y,length:3,kind:"access",reviewRequired:true,connectsTo:hall.id});
  if(z.kind!=="primary"||plan.brief.purpose==="rental"||plan.brief.sideFt<3||z.d<8)continue;
  const x=right?z.x:z.x+z.w;
  const occupied=plan.zones.some(a=>a.id!==z.id&&a.floor===z.floor&&!["open","parking"].includes(a.kind)&&Math.abs((right?a.x+a.w:a.x)-x)<EPS&&Math.min(a.y+a.d,z.y+z.d)-Math.max(a.y,z.y)>EPS);
  if(!occupied)result.push({id:z.id+"-glazing",zoneId:z.id,floor:z.floor,axis:"y",x,y:z.y+z.d/2-2,length:4,kind:"exterior-glazing",reviewRequired:true});
 }
 if(plan.id.endsWith("-cross-v1"))for(const hall of plan.zones.filter(z=>z.kind==="circulation"&&z.floor===0)){
  for(const [side,x] of [["left",hall.x],["right",hall.x+hall.w]] as const)result.push({id:hall.id+"-side-entry-"+side,zoneId:hall.id,floor:hall.floor,axis:"y",x,y:hall.y+(hall.d-4)/2,length:4,kind:"access",reviewRequired:true});
 }
 for(const p of commercialFrontPanels(plan)){
  if(p.w<8)continue;
  // Front panels already select the nearest covered wall across each frontage interval.
  // A parking forecourt can move that wall back from the nominal setback.
  const entry=p.kind==="circulation"&&p.floor===0;
  if(!entry&&(p.kind!=="primary"&&p.kind!=="circulation"&&!(plan.brief.purpose==="school"&&p.kind==="support")))continue;
  if(!entry&&partitioned.has(p.zoneId)){
   // The actual front-facing room owns its aperture, never a parent envelope
   // or a shaft/toilet. Rental living and bedroom glazing remains privacy-sized.
   const usable=inside.filter(r=>r.parentId===p.zoneId&&Math.abs(r.y-p.y)<EPS&&(plan.brief.purpose==="rental"?["living","bedroom"].includes(r.kind):plan.brief.purpose==="school"?["service-a","service-b"].includes(r.kind):false));
   for(const r of usable){
    const left=Math.max(r.x,p.x),right=Math.min(r.x+r.w,p.x+p.w),span=right-left;
    if(span<6)continue;
    const length=Math.min(plan.brief.purpose==="school"?10:7,span-2,span*.65);
    result.push({id:r.id+"-front-"+p.x,zoneId:r.id,floor:p.floor,axis:"x",x:left+(span-length)/2,y:p.y,length,kind:"exterior-glazing",reviewRequired:true});
   }
   continue;
  }
  if(partitioned.has(p.zoneId)||plan.brief.purpose==="rental"&&!entry)continue;
  const glazingRatio={shops:.80,mall:.86,restaurant:.72,school:.52,rental:.45}[plan.brief.purpose];
  const glazingCap={shops:22,mall:26,restaurant:18,school:12,rental:8}[plan.brief.purpose];
  const length=entry?Math.min(6,p.w-2):Math.min(glazingCap,p.w-2,Math.max(4,p.w*glazingRatio));
  result.push({id:p.zoneId+"-front-"+p.x,zoneId:p.zoneId,floor:p.floor,axis:"x",x:p.x+(p.w-length)/2,y:p.y,length,kind:entry?"access":"exterior-glazing",reviewRequired:true});
 }
 const openings=[...result,...commercialInternalOpenings(plan)];
 return [...openings,...additionalCommercialGlazing(plan,openings)];
}
 /** Indicative loose furniture, not seat capacity or compliant aisle design. */
export function commercialFixtures(plan:BuildingConcept):CommercialFixture[]{
 if(plan.brief.purpose==="rental"){
  const portals=commercialPortals(plan),out:CommercialFixture[]=[];
  for(const r of commercialInternalSpaces(plan)){
   const kind=r.kind==="bedroom"?"bed":r.kind==="living"?"sofa":r.kind==="kitchen"?"counter":null;
   if(!kind)continue;
   const w=kind==="bed"?5:kind==="sofa"?6:5,d=kind==="bed"?6.5:kind==="sofa"?2.5:2;
   if(r.w<w+4||r.d<d+4)continue;
   const blocked=portals.filter(p=>p.zoneId===r.id||p.connectsTo===r.id).map(portalClearance);
   const candidates=[{x:r.x+2,y:r.y+2,w,d},{x:r.x+r.w-w-2,y:r.y+2,w,d},{x:r.x+2,y:r.y+r.d-d-2,w,d},{x:r.x+r.w-w-2,y:r.y+r.d-d-2,w,d}];
   const fit=candidates.find(c=>blocked.every(b=>overlapArea(c,b)<EPS));if(fit)out.push({...fit,id:r.id+"-furniture",zoneId:r.id,floor:r.floor,kind,label:kind==="bed"?"Bed":kind==="sofa"?"Sofa":"Kitchen counter"});
  }
  return out;
 }
 const result:CommercialFixture[]=[],portals=commercialPortals(plan);
 for(const z of plan.zones.filter(z=>z.kind==="primary")){
  const school=plan.brief.purpose==="school",restaurant=plan.brief.purpose==="restaurant";
  const kind=school?"desk":restaurant?"table":"display",label=school?"Desk group":restaurant?"Table group":"Display island";
  const mall=plan.brief.purpose==="mall";
  const w=school?4:restaurant?4.5:mall?6:4,d=school?2:restaurant?4.5:mall?3:2;
  // Classroom rows, restaurant tables, retail displays and shop shelving have distinct spatial rhythms.
  const pitchX=w+(school?4:restaurant?4.5:mall?6:4),pitchY=d+(school?3:restaurant?4.5:mall?6:4);
  const reserved:Rect[]=portals.filter(p=>p.floor===z.floor&&(p.zoneId===z.id||p.connectsTo===z.id)).map(portalClearance);
  let n=0;
  for(let y=z.y+5;y+d<=z.y+z.d-4&&n<48;y+=pitchY)for(let x=z.x+5;x+w<=z.x+z.w-4&&n<48;x+=pitchX){
   const r={x,y,w,d};
   if(reserved.some(a=>overlapArea(a,r)>EPS))continue;
   result.push({...r,id:z.id+"-fixture-"+n++,zoneId:z.id,floor:z.floor,label,kind});
  }
 }
 return result;
}
/** Bounded, round-robin selection for the overview. All three overview renderers
 * use the exact same subset; room-specific inspection keeps the complete set. */
export function floorPreviewFixtures(plan:BuildingConcept,floor:number,limit=48){
 const groups=new Map<string,CommercialFixture[]>();for(const f of commercialFixtures(plan)){if(f.floor!==floor)continue;const row=groups.get(f.zoneId)??[];row.push(f);groups.set(f.zoneId,row);}
 const cap=Math.max(0,Math.min(48,Number.isFinite(limit)?Math.floor(limit):48)),out:CommercialFixture[]=[];
 const rows=[...groups.values()];for(let i=0;i<48&&out.length<cap;i++)for(const row of rows){if(row[i]&&out.length<cap)out.push(row[i]);}
 return out;
}
export function portalClearance(p:ConceptPortal):Rect{
 return p.axis==="y"?{x:p.x-4,y:p.y-2,w:8,d:p.length+4}:{x:p.x-2,y:p.y-4,w:p.length+4,d:8};
}
export function commercialGeometryIssues(plan:BuildingConcept):string[]{
 const fixtures=commercialFixtures(plan),portals=commercialPortals(plan),issues:string[]=[],spaces=[...plan.zones,...commercialInternalSpaces(plan)];
 for(const f of fixtures){const z=spaces.find(z=>z.id===f.zoneId);if(!z||f.floor!==z.floor||Math.abs(overlapArea(f,z)-f.w*f.d)>EPS)issues.push("Fixture outside parent "+f.id);}
 const byZone=new Map<string,CommercialFixture[]>();for(const f of fixtures){const group=byZone.get(f.zoneId)??[];group.push(f);byZone.set(f.zoneId,group)}
 for(const group of byZone.values())for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++)if(overlapArea(group[i],group[j])>EPS)issues.push("Fixture overlap "+group[i].id);
 for(const p of portals){const z=spaces.find(z=>z.id===p.zoneId);if(!z||p.floor!==z.floor||(p.axis==="y"?p.y<z.y-EPS||p.y+p.length>z.y+z.d+EPS||Math.min(Math.abs(p.x-z.x),Math.abs(p.x-z.x-z.w))>EPS:p.x<z.x-EPS||p.x+p.length>z.x+z.w+EPS||Math.min(Math.abs(p.y-z.y),Math.abs(p.y-z.y-z.d))>EPS))issues.push("Portal outside wall "+p.id);}
 return issues;
}

/** Street-facing surfaces selected by nearest covered zone along each x interval. */
export function commercialFrontPanels(plan:BuildingConcept){
 const panels:{floor:number;zoneId:string;x:number;w:number;y:number;kind:string}[]=[];
 for(let floor=0;floor<plan.brief.floors;floor++){
  const zones=plan.zones.filter(z=>z.floor===floor&&!["open","parking"].includes(z.kind));
  const cuts=[...new Set(zones.flatMap(z=>[z.x,z.x+z.w]))].sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){
   const x=cuts[i],w=cuts[i+1]-x;if(w<EPS)continue;
   const z=zones.filter(z=>z.x<=x+EPS&&z.x+z.w>=x+w-EPS).sort((a,b)=>a.y-b.y)[0];if(z)panels.push({floor,zoneId:z.id,x,w,y:z.y,kind:z.kind});
  }
 }
 return panels;
}

/** Presentation-only facade profile; no invented openings or floor area. Feet.
 * Shared by the elevation and full-building render. */
export function commercialFacadeProfile(purpose:BuildingConcept["brief"]["purpose"]){
 return elevationProfiles[purpose];
}

/** Original purpose-led facade language; presentation only, not structural specifications. */
const frontageLanguage={
 shops:{style:"Urban retail frame",materialMood:"Stone, dark metal and clear glazing",suitability:"Independent shops and high-street retail",finWidth:.45,finSpacing:5.5,finDepth:.65,canopyDepth:2.5},
 mall:{style:"Layered retail podium",materialMood:"Metal fins, stone bands and reflective glass",suitability:"Multi-level retail and shopping centres",finWidth:.65,finSpacing:4,finDepth:1,canopyDepth:4},
 restaurant:{style:"Warm hospitality entrance",materialMood:"Warm accents, bronze tones and glass",suitability:"Restaurants and cafés",finWidth:.4,finSpacing:3.5,finDepth:.7,canopyDepth:3},
 school:{style:"Rhythmic institutional frontage",materialMood:"Muted masonry, metal frames and daylight glazing",suitability:"Schools and learning spaces",finWidth:.55,finSpacing:6,finDepth:.65,canopyDepth:2},
 rental:{style:"Quiet residential rhythm",materialMood:"Stone tones, slender frames and restrained glass",suitability:"Rental apartments and flats",finWidth:.35,finSpacing:5,finDepth:.5,canopyDepth:1.5}
} as const;
export function commercialFrontageLanguage(purpose:BuildingConcept["brief"]["purpose"]){return frontageLanguage[purpose];}
/** Architectural rhythm follows actual circulation and street frontage. */
export function commercialFrontageLanguageForPlan(plan:BuildingConcept){
 const base=commercialFrontageLanguage(plan.brief.purpose);
 const hall=plan.zones.find(z=>z.kind==="circulation"&&z.floor===0);
 const cross=!!hall&&hall.w>hall.d;
 const panels=commercialFrontPanels(plan).filter(p=>p.floor===0);
 const primaryShare=panels.reduce((sum,p)=>sum+(p.kind==="primary"?p.w:0),0)/Math.max(1,panels.reduce((sum,p)=>sum+p.w,0));
 const streetLed=primaryShare>.55;
 const recessed=panels.length>1&&Math.max(...panels.map(p=>p.y))-Math.min(...panels.map(p=>p.y))>1;
 const centralCore=panels.some(p=>p.kind==="core"&&p.x<plan.brief.widthFt*.65&&p.x+p.w>plan.brief.widthFt*.35);
 return {...base,style:base.style+(cross?" · transverse gallery":streetLed?" · open frontage":" · framed frontage")+(recessed?" · stepped massing":centralCore?" · central service tower":""),finSpacing:base.finSpacing*(cross?1.2:streetLed?1.12:.86)*(recessed?1.15:1),finDepth:base.finDepth*(cross?.85:1)*(centralCore?1.12:1),canopyDepth:base.canopyDepth*(streetLed?1.1:1)};
}
export type FrontageDetail={id:string;kind:"fin"|"entry-hood"|"window-head"|"window-sill";floor:number;x:number;y:number;widthFt:number;depthFt:number;bottomFt:number;topFt:number};
/** Shared elevation/render detail geometry in local, road-facing feet.
 * Place fins only on opaque frontage and entrance hoods above actual access openings.
 * Limit projections to the available front space; never create an opening or a floor. */
export function commercialFrontageDetails(plan:BuildingConcept):FrontageDetail[]{
 const style=commercialFrontageLanguageForPlan(plan),profile=commercialFacadeProfile(plan.brief.purpose);
 const portals=commercialPortals(plan),panels=commercialFrontPanels(plan),out:FrontageDetail[]=[];
 for(const [i,p] of panels.entries()){
  const openings=portals.filter(a=>a.floor===p.floor&&a.axis==="x"&&Math.abs(a.y-p.y)<EPS);
  const depth=Math.min(style.finDepth*(p.kind==="core"?1.25:p.kind==="circulation"?.85:1),p.y);
  if(depth>=.3&&p.w>=2.5){
   const count=Math.min(12,Math.max(1,Math.floor(p.w/(style.finSpacing*(p.kind==="core"?.78:1)))));
   for(let n=0;n<count;n++){
    const x=p.x+p.w*(n+.5)/count-style.finWidth/2;
    if(x<p.x+.2||x+style.finWidth>p.x+p.w-.2)continue;
    if(openings.some(a=>x<a.x+a.length+.2&&x+style.finWidth>a.x-.2))continue;
    out.push({id:`fin-${i}-${n}`,kind:"fin",floor:p.floor,x,y:p.y,widthFt:style.finWidth,depthFt:depth,bottomFt:.8,topFt:12.5-profile.bandFt-.2});
   }
  }
  // Purpose-led detailing on the existing opaque strips above/below real glazing.
  // Keep clear of the aperture and do not add any floor area or structural claim.
  if(p.y>=.3)for(const a of openings.filter(a=>a.kind==="exterior-glazing"&&a.x>=p.x-EPS&&a.x+a.length<=p.x+p.w+EPS)){
   const purpose=plan.brief.purpose;
   const spread=purpose==="mall"?.65:purpose==="restaurant"?.40:purpose==="school"?.25:.15;
   const x=Math.max(p.x,a.x-spread),right=Math.min(p.x+p.w,a.x+a.length+spread);
   const head=purpose==="mall"?{bottom:8.35,top:10.05,depth:1.85}:purpose==="restaurant"?{bottom:8.25,top:9.2,depth:1.25}:purpose==="school"?{bottom:8.3,top:8.75,depth:1.55}:purpose==="shops"?{bottom:8.25,top:8.85,depth:.85}:null;
   if(head)out.push({id:`head-${i}-${a.id}`,kind:"window-head",floor:p.floor,x,y:p.y,widthFt:right-x,depthFt:Math.min(head.depth,p.y),bottomFt:head.bottom,topFt:head.top});
   if(purpose!=="mall")out.push({id:`sill-${i}-${a.id}`,kind:"window-sill",floor:p.floor,x,y:p.y,widthFt:right-x,depthFt:Math.min(purpose==="rental"?.85:purpose==="restaurant"?.45:.35,p.y),bottomFt:purpose==="rental"?2.35:2.65,topFt:2.95});
  }
  if(p.floor!==0||p.y<1)continue;
  for(const a of openings.filter(a=>a.kind==="access"&&a.x>=p.x-EPS&&a.x+a.length<=p.x+p.w+EPS)){
   const purpose=plan.brief.purpose,margin=purpose==="mall"?1.0:purpose==="restaurant"?.75:purpose==="school"?.65:.4;
   const x=Math.max(p.x,a.x-margin),right=Math.min(p.x+p.w,a.x+a.length+margin);
   const topFt=purpose==="mall"?9.65:purpose==="restaurant"?9.1:purpose==="school"?8.95:8.85;
   out.push({id:`hood-${a.id}`,kind:"entry-hood",floor:0,x,y:p.y,widthFt:right-x,depthFt:Math.min(style.canopyDepth,p.y),bottomFt:8.35,topFt});
  }
 }
 return out;
}
