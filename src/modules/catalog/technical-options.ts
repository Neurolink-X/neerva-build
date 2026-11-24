import type {DemoProduct} from "./marketplace.ts";
/** Specification-only choices: no authorised manufacturer, live inventory or public price claims. */
type Row={category:string;familyKey:string;brand:string;kind:string;spec:string;values:string[];unit:string;note:string};
const rows:Row[]=[
 {category:"plumbing",familyKey:"generic-tank-inlet-pipe",brand:"Brand to confirm",kind:"Water tank inlet and outlet connection pipe",spec:"Nominal size",values:["20","25","32","40"],unit:"mm",note:"Match tank connector, pipe material and isolation valve; verify pressure rating"},
 {category:"plumbing",familyKey:"generic-pump-delivery-pipe",brand:"Brand to confirm",kind:"Pump discharge / delivery pipe",spec:"Nominal size",values:["25","32","40","50"],unit:"mm",note:"Confirm pump outlet diameter, working pressure and compatible couplings"},
 {category:"plumbing",familyKey:"generic-flex-pump-connector",brand:"Brand to confirm",kind:"Flexible pump connection hose",spec:"Nominal size",values:["25","32","40"],unit:"mm",note:"Confirm vacuum or discharge rating, end fittings and vibration isolation"},
 {"category":"plumbing","familyKey":"generic-upvc-pressure","brand":"Brand to confirm","kind":"uPVC cold water pressure pipe","spec":"Nominal size","values":["20","25","32","40","50"],"unit":"mm","note":"Confirm pressure class, potable-water suitability and compatible fittings"},
 {"category":"plumbing","familyKey":"generic-ppr","brand":"Brand to confirm","kind":"PPR hot/cold water pipe","spec":"Nominal size","values":["20","25","32"],"unit":"mm","note":"Confirm pressure and temperature ratings and fusion method"},
 {"category":"plumbing","familyKey":"generic-pex","brand":"Brand to confirm","kind":"PEX water supply tubing","spec":"Nominal size","values":["16","20","25"],"unit":"mm","note":"Confirm tubing standard and compatible connection system"},
 {"category":"plumbing","familyKey":"generic-column","brand":"Brand to confirm","kind":"Borewell column pipe","spec":"Nominal size","values":["25","32","40","50"],"unit":"mm","note":"Confirm pump load, depth and threaded joint rating"},
 {"category":"plumbing","familyKey":"generic-casing","brand":"Brand to confirm","kind":"Borewell casing pipe","spec":"Nominal size","values":["110","125","160"],"unit":"mm","note":"Confirm bore diameter, wall class and drilling conditions"},
 {"category":"plumbing","familyKey":"generic-rainwater","brand":"Brand to confirm","kind":"Rainwater downpipe","spec":"Nominal size","values":["75","90","110"],"unit":"mm","note":"Confirm roof runoff design and compatible brackets"},
 {"category":"plumbing","familyKey":"generic-underground-drain","brand":"Brand to confirm","kind":"Underground drainage pipe","spec":"Nominal size","values":["110","160","200"],"unit":"mm","note":"Confirm stiffness class and burial installation"},
 {"category":"plumbing","familyKey":"generic-suction-hose","brand":"Brand to confirm","kind":"Flexible suction hose","spec":"Nominal size","values":["25","32","50"],"unit":"mm","note":"Confirm vacuum rating and pump compatibility"},
 {"category":"plumbing","familyKey":"generic-garden-hose","brand":"Brand to confirm","kind":"Garden water hose","spec":"Nominal size","values":["12","19","25"],"unit":"mm","note":"Confirm internal diameter and pressure rating"},
 {"category":"plumbing","familyKey":"generic-tee","brand":"Brand to confirm","kind":"Plumbing tee fitting","spec":"Nominal size","values":["20","25","32"],"unit":"mm","note":"Match material, pipe series and connection type"},
 {"category":"plumbing","familyKey":"generic-coupler","brand":"Brand to confirm","kind":"Plumbing coupling / socket","spec":"Nominal size","values":["20","25","32"],"unit":"mm","note":"Match pipe material and fitting series"},
 {"category":"plumbing","familyKey":"generic-reducer","brand":"Brand to confirm","kind":"Plumbing reducer fitting","spec":"Nominal size","values":["25 × 20","32 × 25","40 × 32"],"unit":"mm","note":"Confirm both end sizes and pipe material"},
 {"category":"plumbing","familyKey":"generic-union","brand":"Brand to confirm","kind":"Plumbing union fitting","spec":"Nominal size","values":["20","25","32"],"unit":"mm","note":"Confirm material, seal and pressure class"},
 {"category":"plumbing","familyKey":"generic-ball-valve","brand":"Brand to confirm","kind":"Water supply ball valve","spec":"Nominal size","values":["20","25","32"],"unit":"mm","note":"Confirm material, end connection and pressure"},
 {"category":"plumbing","familyKey":"generic-trap","brand":"Brand to confirm","kind":"Drainage trap","spec":"Requested type","values":["Bottle trap","P trap","Floor trap"],"unit":"type","note":"Confirm outlet, water seal and installation space"},
 {"category":"plumbing","familyKey":"generic-pipe-clamp","brand":"Brand to confirm","kind":"Pipe clamp and hanger","spec":"Nominal size","values":["20","25","32"],"unit":"mm","note":"Confirm outside diameter, support spacing and substrate"},
 {"category":"plumbing","familyKey":"generic-solvent","brand":"Brand to confirm","kind":"Pipe solvent cement","spec":"Requested type","values":["CPVC","uPVC"],"unit":"type","note":"Use only compatible manufacturer-approved joining system"},
 {"category":"electrical","familyKey":"generic-heavy-conduit","brand":"Brand to confirm","kind":"Heavy-duty rigid PVC electrical conduit","spec":"Nominal size","values":["20","25","32","40"],"unit":"mm","note":"Confirm mechanical class, wall thickness and installation conditions"},
 {"category":"electrical","familyKey":"generic-flex-conduit","brand":"Brand to confirm","kind":"Flexible corrugated electrical conduit","spec":"Nominal size","values":["16","20","25","32"],"unit":"mm","note":"Confirm bend radius, mechanical protection and cable fill"},
 {"category":"electrical","familyKey":"generic-dwc-duct","brand":"Brand to confirm","kind":"DWC HDPE cable duct","spec":"Nominal size","values":["40","50","63","90"],"unit":"mm","note":"Confirm duct class, burial design and cable pulling requirements"},
 {"category":"electrical","familyKey":"generic-casing-capping","brand":"Brand to confirm","kind":"Electrical casing and capping","spec":"Nominal size","values":["20","25","32"],"unit":"mm","note":"Confirm actual profile dimensions, installation and fire requirements"},
 {"category":"electrical","familyKey":"generic-conduit-bend","brand":"Brand to confirm","kind":"Electrical conduit bend","spec":"Nominal size","values":["20","25","32"],"unit":"mm","note":"Confirm conduit series and bend radius"},
 {"category":"electrical","familyKey":"generic-conduit-coupler","brand":"Brand to confirm","kind":"Electrical conduit coupler","spec":"Nominal size","values":["20","25","32"],"unit":"mm","note":"Match conduit outside diameter and connection series"},
 {"category":"electrical","familyKey":"generic-junction-box","brand":"Brand to confirm","kind":"Electrical conduit junction box","spec":"Requested type","values":["2 way","3 way","4 way"],"unit":"type","note":"Confirm entry size, enclosure rating and installation"},
 {"category":"electrical","familyKey":"generic-conduit-clamp","brand":"Brand to confirm","kind":"Electrical conduit saddle / clamp","spec":"Nominal size","values":["20","25","32"],"unit":"mm","note":"Confirm conduit diameter and mounting method"},
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
