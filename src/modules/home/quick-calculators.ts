export const calculatorSpecs=[
{id:"excavation",title:"Excavation",fields:[["Length (ft)",10],["Width (ft)",5],["Depth (ft)",3]],unit:"m³",note:"Rectangular measured volume only; excludes side slopes, working space and soil bulking."},
{id:"slab",title:"Slab / screed volume",fields:[["Area (sq ft)",100],["Approved thickness (mm)",100]],unit:"m³",note:"Thickness must come from the approved design, not this calculator."},
{id:"plaster",title:"Plaster volume",fields:[["Net surface area (sq ft)",100],["Specified thickness (mm)",12],["Allowance (%)",5]],unit:"m³",note:"Wet mortar volume only; no assumed cement:sand mix or dry-volume factor."},
{id:"paint",title:"Paint",fields:[["Net surface area (sq ft)",100],["Coats",2],["Product coverage (m²/L/coat)",10],["Allowance (%)",5]],unit:"L",note:"Use manufacturer coverage for the actual surface; primer is separate."},
{id:"tiles",title:"Tiles",fields:[["Net floor area (sq ft)",100],["Tile length (mm)",600],["Tile width (mm)",600],["Allowance (%)",10]],unit:"tiles",note:"Rounded up to whole tiles; verify layout, cuts and carton quantities."},
{id:"tank",title:"Water tank capacity",fields:[["Internal length (m)",2],["Internal width (m)",1],["Usable water depth (m)",1]],unit:"L",note:"Rectangular usable water volume; not a structural or demand-sizing recommendation."},
{id:"roof",title:"Roof waterproofing area",fields:[["Measured roof area (sq ft)",1000],["Upstand area (sq ft)",50],["Allowance (%)",10]],unit:"m²",note:"Use actual slope surface and product-specific overlap details."},
{id:"formwork",title:"Formwork contact area",fields:[["Measured contact length (m)",10],["Contact width / height (m)",0.3],["Number of identical faces",2]],unit:"m²",note:"Calculate each distinct face separately; excludes supports and design."},
{id:"floor",title:"Flooring cost",fields:[["Measured area (sq ft)",100],["Material rate (₹/sq ft)",80],["Labour rate (₹/sq ft)",30],["Material allowance (%)",10]],unit:"₹",note:"Material allowance applies only to material; taxes and other costs excluded."},
{id:"units",title:"Area conversion",fields:[["Area (sq ft)",1000]],unit:"m²",note:"1 sq ft = 0.09290304 m² exactly."}
] as const;
export type CalculatorId=typeof calculatorSpecs[number]["id"];
export function quickEstimate(id:CalculatorId,v:readonly number[]):number|null{
const spec=calculatorSpecs.find(s=>s.id===id);if(!spec||v.length!==spec.fields.length||v.some(n=>!Number.isFinite(n)||n<0||n>1e9))return null;
if(spec.fields.some(([label],i)=>label.includes("Allowance (%)")&&v[i]>100))return null;
const [a,b,c,d]=v;let result:number;
switch(id){case "excavation":result=a*b*c*0.028316846592;break;case "slab":result=a*.09290304*b/1000;break;case "plaster":result=a*.09290304*b/1000*(1+c/100);break;case "paint":if(c<=0||!Number.isInteger(b)||b<1)return null;result=a*.09290304*b/c*(1+d/100);break;case "tiles":if(b<=0||c<=0)return null;result=Math.ceil(a*.09290304/(b*c/1e6)*(1+d/100));break;case "tank":result=a*b*c*1000;break;case "roof":result=(a+b)*.09290304*(1+c/100);break;case "formwork":if(!Number.isInteger(c)||c<1)return null;result=a*b*c;break;case "floor":result=a*(b*(1+d/100)+c);break;case "units":result=a*.09290304;break;default:return null;}return Number.isFinite(result)?result:null;
}
