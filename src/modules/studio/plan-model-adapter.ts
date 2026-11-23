import type {StudioDesign,DesignRoom} from "./library.ts";
import type {PlanModel,RoomKind} from "./plan-model.ts";
import {planMetrics} from "./plan-model.ts";
const kindMap:Record<RoomKind,DesignRoom["kind"]>={
 parking:"parking",verandah:"open",living:"living",dining:"living",kitchen:"kitchen",
 bedroom:"bedroom",bath:"bath",stairs:"stairs",corridor:"living",utility:"utility",
 balcony:"open",lounge:"living",terrace:"open"
};
const kind=(k:RoomKind):DesignRoom["kind"]=>kindMap[k];
const facing={N:"North",E:"East",S:"South",W:"West"} as const;
/** Adapter, never an independent plan; 3D meshes are derived from exactly PlanModel rooms and openings. */
export function studioDesignFromPlan(p:PlanModel):StudioDesign{
 const metrics=planMetrics(p);
 const rooms:DesignRoom[]=p.rooms.map(r=>({
  id:r.id,label:r.label,kind:kind(r.kind),floorIndex:r.floor,
  xFt:r.x,yFt:r.y,wFt:r.w,dFt:r.d,
  openings:p.openings.filter(o=>o.roomId===r.id).map(o=>({
   kind:o.kind,wall:o.side,offsetFt:o.atFt,widthFt:o.widthFt,sillFt:o.sillFt,heightFt:o.heightFt
  }))
 }));
 return {
  id:p.id,slug:p.id,title:"Road-first 18×50 concept",titleHi:"सड़क की तरफ सही प्रवेश वाला प्लान",
  style:"warm-modern",plot:{widthFt:p.plot.widthFt,depthFt:p.plot.depthFt,areaSqFt:p.plot.widthFt*p.plot.depthFt},
  facing:facing[p.plot.roadSide],floors:p.floors,
  bedrooms:p.rooms.filter(r=>r.kind==="bedroom").length,
  bathrooms:p.rooms.filter(r=>r.kind==="bath").length,
  parking:!!p.parking,hasCourtyard:false,roof:"flat-rcc",
  layout:{version:1,rooms,wallThicknessFt:p.walls.internalFt,wallHeightFt:p.walls.heightFt,parapetHeightFt:p.walls.parapetFt},
  elevation:{mass:p.facade.kit,surfaces:{
    main:p.facade.main,accent:p.facade.accent,cladding:"#756a59",railing:"#33453f",
    gate:"#3f4b44",frame:"#384c48",boundary:"#d4d5cb"
   },finishes:["smooth"],viewModes:["day","evening"]},
  areas:{carpetSqFt:Math.round(metrics.roomFloorSqFt),builtUpSqFt:Math.round(metrics.roomFloorSqFt)},
  costRangePerSqFt:{minInr:null,maxInr:null,status:"pending-admin-verification"},
  vastuNote:"Vastu is not verified. Obtain independent professional review.",
  model:{format:"neerva-plan-model-v1-adapter",source:"src/modules/studio/plan-model.ts",roofType:"flat-rcc",openingsFromRooms:true},
  conceptOnly:true
 };
}
