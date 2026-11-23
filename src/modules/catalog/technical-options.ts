import type {DemoProduct} from "./marketplace.ts";
/** Specification-only choices: no authorised manufacturer, live inventory or public price claims. */
type Row={category:string;familyKey:string;brand:string;kind:string;spec:string;values:string[];unit:string;note:string};
const rows:Row[]=[
 {category:"plumbing",familyKey:"generic-cpvc",brand:"Brand to confirm",kind:"CPVC hot/cold water pipe",spec:"Nominal size",values:["15","20","25","32","40"],unit:"mm",note:"Check pressure class, hot-water suitability and fittings"},
 {category:"plumbing",familyKey:"generic-upvc",brand:"Brand to confirm",kind:"uPVC SWR/drainage pipe",spec:"Nominal size",values:["75","90","110","160"],unit:"mm",note:"Check wall thickness, joint class and drain fittings"},
 {category:"plumbing",familyKey:"generic-hdpe",brand:"Brand to confirm",kind:"HDPE water supply pipe",spec:"Nominal size",values:["25","32","40","63"],unit:"mm",note:"Check PE grade, pressure rating and joint method"},
 {category:"plumbing",familyKey:"generic-plumbing-fitting",brand:"Brand to confirm",kind:"CPVC elbow fitting",spec:"Nominal size",values:["20","25","32"],unit:"mm",note:"Check compatible pipe series and solvent joint"},
 {category:"steel",familyKey:"generic-fe500d",brand:"Mill to confirm",kind:"TMT reinforcement Fe 500D",spec:"Diameter",values:["8","10","12","16","20","25"],unit:"mm",note:"Check mill identity, IS 1786, lengths and test certificate"},
 {category:"steel",familyKey:"generic-fe550d",brand:"Mill to confirm",kind:"TMT reinforcement Fe 550D",spec:"Diameter",values:["8","10","12","16","20"],unit:"mm",note:"Check ductility grade, mill test certificate and measured weight"},
 {category:"bricks-blocks",familyKey:"generic-clay",brand:"Local kiln to confirm",kind:"Red fired clay brick",spec:"Requested type",values:["Standard","Wire-cut"],unit:"type",note:"Check dimensions, strength and water absorption"},
 {category:"bricks-blocks",familyKey:"generic-fly-ash",brand:"Local plant to confirm",kind:"Fly-ash masonry brick",spec:"Requested format",values:["Standard","Large"],unit:"format",note:"Check dimensions, density and strength documents"},
 {category:"bricks-blocks",familyKey:"generic-hollow",brand:"Local plant to confirm",kind:"Hollow concrete masonry block",spec:"Thickness",values:["100","150","200"],unit:"mm",note:"Check length, height, strength and handling"},
 {category:"cement",familyKey:"generic-cement",brand:"Brand to confirm",kind:"Cement",spec:"Type",values:["PPC","OPC 43","OPC 53","PSC"],unit:"grade",note:"Check bag weight, age, IS mark and suitability"},
 {category:"electrical",familyKey:"generic-wire",brand:"Brand to confirm",kind:"Building copper wire FR/FR-LSH",spec:"Conductor size",values:["1.5","2.5","4","6"],unit:"sq mm",note:"Check insulation designation, colour, length and BIS marks"},
 {category:"electrical",familyKey:"generic-conduit",brand:"Brand to confirm",kind:"Rigid electrical conduit",spec:"Nominal size",values:["20","25","32"],unit:"mm",note:"Check material, wall class, fittings and length"}
];
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export const technicalOptions:DemoProduct[]=rows.flatMap(row=>row.values.map(value=>({
 category:row.category,familyKey:row.familyKey,brand:row.brand,
 slug:row.familyKey+"-"+slug(value)+(row.unit==="mm"?"mm":row.unit==="sq mm"?"sqmm":""),
 name:row.kind+" · "+value+(["type","format","grade"].includes(row.unit)?"":" "+row.unit),
 description:"Technical selection for a dealer quote. "+row.note+". No stock or manufacturer identity is implied.",
 verification:"reference" as const,
 specifications:[
  {label:row.spec,value:value+(row.unit==="mm"?" mm":row.unit==="sq mm"?" sq mm":"")},
  {label:"Product family",value:row.kind},
  {label:"Confirm with dealer",value:row.note}
 ]
})));
