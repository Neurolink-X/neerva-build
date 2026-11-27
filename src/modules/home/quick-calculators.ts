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
{id:"units",title:"Area conversion",fields:[["Area (sq ft)",1000]],unit:"m²",note:"1 sq ft = 0.09290304 m² exactly."},
{id:"rainwater",title:"Rainwater collection potential",fields:[["Roof catchment (m²)",100],["Rainfall for period (mm)",100],["Collection efficiency (%)",80]],unit:"L",note:"Illustrative collected volume before storage overflow; use measured local rainfall and combined system-specific losses. Not a tank sizing recommendation."},
{id:"energy",title:"Energy running cost",fields:[["Equipment input power (W)",100],["Operating hours per day",8],["Days in period",30],["Electricity rate (₹/kWh)",8]],unit:"₹",note:"Assumes constant input power and tariff; excludes fixed charges, taxes and variable loads."},
{id:"budget",title:"Construction budget scenario",fields:[["Total planned built-up area (sq ft)",1000],["Estimated rate (₹/sq ft)",2000],["Contingency allowance (%)",10]],unit:"₹",note:"Use measured floor areas and a current written local estimate. Not a quote or permitted floor area calculation."},
{id:"lifecycle",title:"Lifecycle cost comparison",fields:[["Initial installed cost (₹)",100000],["Annual running and maintenance cost (₹)",5000],["Comparison period (years)",20]],unit:"₹",note:"Undiscounted total at constant assumed costs; excludes inflation, financing, replacements and residual value."},
{id:"mortar",title:"Specified mortar batch",fields:[["Measured dry ingredient volume (L)",100],["Cement ratio parts",1],["Sand ratio parts",4]],unit:"L cement",note:"Volume proportion only, not wet mortar yield. Use an approved mix specification; no recommended mix ratio is implied."},
{id:"packs",title:"Material pack planning",fields:[["Measured required quantity",100],["Quantity per pack",20],["Allowance (%)",5]],unit:"packs",note:"Use identical units for quantity and pack size; rounds up. Confirm actual pack coverage and availability."},
{id:"ventilation",title:"Openable window area ratio",fields:[["Floor area (m²)",20],["Net openable external window area (m²)",2]],unit:"%",note:"Geometric ventilation potential only. Actual airflow depends on wind, openings and layout. Check current ENS and local requirements with a qualified designer."},
{id:"module-grid",title:"Modular component planning",fields:[["Measured run length (mm)",3600],["Component pitch including joint (mm)",600]],unit:"whole modules",note:"Counts complete repeated pitches along a straight run. Check residual length, joints, tolerances and approved connections separately."},
{id:"slope",title:"Drainage slope geometry",fields:[["Horizontal run (m)",5],["Specified slope (%)",2]],unit:"mm fall",note:"Geometric fall only. Obtain required slope from approved drainage or waterproofing design; check levels on site."},
{id:"reuse",title:"Material recovery ratio",fields:[["Total measured material mass (kg)",1000],["Verified reusable or recyclable mass (kg)",700]],unit:"%",note:"Mass-based recovery potential, not a certified recycling rate. Verify contamination, condition and local recovery options."},
{id:"energy-use",title:"Equipment energy consumption",fields:[["Measured input power (W)",100],["Operating hours per day",8],["Days in period",30]],unit:"kWh",note:"Constant power estimate, independent of tariffs. Use measured consumption for variable loads."}
] as const;
export type CalculatorId=typeof calculatorSpecs[number]["id"];
export function quickEstimate(id:CalculatorId,v:readonly number[]):number|null{
const spec=calculatorSpecs.find(s=>s.id===id);if(!spec||calculatorErrors(id,v).some(Boolean))return null;
const [a,b,c,d]=v;let result:number;
switch(id){case "excavation":result=a*b*c*0.028316846592;break;case "slab":result=a*.09290304*b/1000;break;case "plaster":result=a*.09290304*b/1000*(1+c/100);break;case "paint":if(c<=0||!Number.isInteger(b)||b<1)return null;result=a*.09290304*b/c*(1+d/100);break;case "tiles":if(b<=0||c<=0)return null;result=Math.ceil(a*.09290304/(b*c/1e6)*(1+d/100));break;case "tank":result=a*b*c*1000;break;case "roof":result=(a+b)*.09290304*(1+c/100);break;case "formwork":if(!Number.isInteger(c)||c<1)return null;result=a*b*c;break;case "floor":result=a*(b*(1+d/100)+c);break;case "units":result=a*.09290304;break;case "rainwater":if(c>100)return null;result=a*b*c/100;break;case "energy":if(b>24)return null;result=a*b*c*d/1000;break;case "budget":result=a*b*(1+c/100);break;case "lifecycle":if(!Number.isInteger(c)||c<1||c>100)return null;result=a+b*c;break;case "mortar":if(b<=0||c<=0)return null;result=a*b/(b+c);break;case "packs":if(b<=0)return null;result=Math.ceil(a*(1+c/100)/b);break;case "ventilation":if(a<=0)return null;result=b/a*100;break;case "module-grid":if(b<=0)return null;result=Math.floor(a/b);break;case "slope":if(a<=0||b>100)return null;result=a*b*10;break;case "reuse":if(a<=0||b>a)return null;result=b/a*100;break;case "energy-use":if(b>24)return null;result=a*b*c/1000;break;default:return null;}return Number.isFinite(result)?result:null;
}

type FieldRule={min?:number;max?:number;whole?:boolean;positive?:boolean};
const positive={positive:true},percent={max:100},count={min:1,whole:true};
const rules:Record<CalculatorId,readonly FieldRule[]>={
 excavation:[positive,positive,positive],slab:[positive,positive],plaster:[positive,positive,percent],
 paint:[positive,count,positive,percent],tiles:[positive,positive,positive,percent],tank:[positive,positive,positive],
 roof:[positive,{},percent],formwork:[positive,positive,count],floor:[positive,{},{},percent],units:[{}],
 rainwater:[positive,{},percent],energy:[{}, {max:24},{},{}],budget:[positive,{},percent],
 lifecycle:[{},{},{min:1,max:100,whole:true}],mortar:[positive,positive,positive],packs:[{},positive,percent],
 ventilation:[positive,{}],"module-grid":[positive,positive],slope:[positive,percent],reuse:[positive,{}],"energy-use":[{},{max:24},{}]
};
export function calculatorFieldRule(id:CalculatorId,index:number):FieldRule{return rules[id]?.[index]??{};}
export function calculatorErrors(id:CalculatorId,values:readonly number[]):string[]{
 const spec=calculatorSpecs.find(s=>s.id===id);
 if(!spec||values.length!==spec.fields.length)return ["Input count does not match this calculator."];
 return spec.fields.map((_,i)=>{
  const n=values[i],r=calculatorFieldRule(id,i);
  if(!Number.isFinite(n))return "Enter a valid number.";
  if(n<0||n>1e9)return "Enter a number between 0 and 1,000,000,000.";
  if(r.positive&&n<=0)return "Must be greater than zero.";
  if(r.min!==undefined&&n<r.min)return "Minimum: "+r.min+".";
  if(r.max!==undefined&&n>r.max)return "Maximum: "+r.max+".";
  if(r.whole&&!Number.isInteger(n))return "Enter a whole number.";
  if(id==="reuse"&&i===1&&n>values[0])return "Cannot exceed total measured mass.";
  return "";
 });
}
export const calculatorFormulas:Record<CalculatorId,string>={
 excavation:"Length × width × depth × 0.028316846592",slab:"Area × 0.09290304 × thickness ÷ 1,000",plaster:"Net area × thickness in metres × (1 + allowance/100), after area conversion",
 paint:"Net area in m² × coats ÷ coverage × (1 + allowance/100)",tiles:"Round up (net area in m² ÷ tile area in m² × (1 + allowance/100))",tank:"Internal length × width × usable depth × 1,000",
 roof:"(Roof + upstands) × 0.09290304 × (1 + allowance/100)",formwork:"Length × contact width × number of faces",floor:"Area × (material rate × (1 + allowance/100) + labour rate)",
 units:"Square feet × 0.09290304",rainwater:"Catchment area × rainfall × collection efficiency/100",energy:"Power ÷ 1,000 × hours × days × tariff",budget:"Built-up area × rate × (1 + contingency/100)",
 lifecycle:"Installed cost + annual cost × years",mortar:"Dry volume × cement parts ÷ total parts",packs:"Round up (required quantity × (1 + allowance/100) ÷ pack size)",
 ventilation:"Openable window area ÷ floor area × 100","module-grid":"Round down (run ÷ component pitch)",slope:"Horizontal run × slope percentage × 10",reuse:"Recoverable mass ÷ total mass × 100","energy-use":"Power ÷ 1,000 × hours × days"
};
export function calculatorBreakdown(id:CalculatorId,v:readonly number[],result:number):{label:string;value:number;unit:string}[]{
 const [a,b,c,d]=v;
 switch(id){
  case "units":return [{label:"Square feet",value:a,unit:"sq ft"},{label:"Square gaj",value:a/9,unit:"sq gaj"},{label:"Hectares",value:result/10000,unit:"ha"}];
  case "tiles":return [{label:"Net area",value:a*.09290304,unit:"m²"},{label:"Nominal purchased tile area",value:result*b*c/1e6,unit:"m²"}];
  case "paint":return [{label:"Before allowance",value:a*.09290304*b/c,unit:"L"}];
  case "budget":return [{label:"Base estimate",value:a*b,unit:"₹"},{label:"Contingency",value:a*b*c/100,unit:"₹"}];
  case "floor":return [{label:"Material with allowance",value:a*b*(1+d/100),unit:"₹"},{label:"Labour",value:a*c,unit:"₹"}];
  case "energy":return [{label:"Energy for period",value:a*b*c/1000,unit:"kWh"}];
  case "energy-use":return [{label:"Daily energy",value:a*b/1000,unit:"kWh"}];
  case "lifecycle":return [{label:"Running and maintenance total",value:b*c,unit:"₹"}];
  case "mortar":return [{label:"Sand volume",value:a*c/(b+c),unit:"L"}];
  case "packs":return [{label:"Purchased quantity",value:result*b,unit:"units"},{label:"Surplus after allowance",value:Math.max(0,result*b-a*(1+c/100)),unit:"units"}];
  case "module-grid":return [{label:"Remaining length",value:Math.max(0,a-result*b),unit:"mm"}];
  case "rainwater":return [{label:"Before collection losses",value:a*b,unit:"L"}];
  case "tank":return [{label:"Usable cubic metres",value:result/1000,unit:"m³"}];
  case "reuse":return [{label:"Unrecovered mass",value:a-b,unit:"kg"}];
  default:return [];
 }
}
