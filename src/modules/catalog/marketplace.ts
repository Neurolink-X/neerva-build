import {hardwareReferences,hardwareGroups} from "./hardware-references.ts";
import {aggregateProducts} from "./aggregate-references.ts";
import {sourcedProducts} from "./sourced-products.ts";
import {technicalOptions} from "./technical-options.ts";
import { catalogCategories } from "./catalog.ts";

export type DemoProduct = {
  /** Photos only when uploaded and approved by an authorized dealer/admin. */
  images?: string[];
  imageVerified?: boolean;
  referenceImage?:string;
  /** Reference sizes grouped as a visible family; each retains its own route and spec. */
  familyKey?:string;
  referenceSource?:string;
  manufacturerReference?: string;
  manufacturerSku?: string | null;
  slug: string;
  category: string;
  name: string;
  description: string;
  brand: string;
  specifications: { label: string; value: string }[];
  /** Listing examples are not verified manufacturer SKUs, dealer stock or offers. */
  verification: "reference" | "merchant_verified";
  quoteOnly?: boolean;
};

// Brand names and examples help discovery only. There is no claim of dealer
// authorization, live inventory, certification, or a current selling price.
export const demoProducts: DemoProduct[] = [
  ...sourcedProducts,
  ...hardwareReferences.filter(r=>r.brand==="Local supplier").map((r):DemoProduct=>({slug:r.slug,category:"hardware",brand:r.brand,name:r.name,verification:"reference",description:r.application+". Confirm the exact supplier variant before ordering.",specifications:[{label:"Category",value:hardwareGroups[r.group]},{label:"Size / pack",value:r.pack},{label:"Application",value:r.application},{label:"Before ordering",value:"Confirm dimensions, material, compatibility and delivered price"}]})),
  ...technicalOptions,
  ...aggregateProducts,
  { verification: "reference", slug: "fe-500d-tmt-12mm", category: "steel", name: "TMT bar · Fe 500D · 12 mm", description: "Illustrative product profile. Confirm the exact manufacturer range and test documents with the supplying dealer.", brand: "Tata Tiscon", specifications: [{ label: "Grade", value: "Fe 500D (verify SKU)" }, { label: "Diameter", value: "12 mm" }, { label: "Typical unit", value: "kg / quintal / tonne" }, { label: "Supply note", value: "Actual weight and bundle details must be confirmed" }] },
  { verification: "reference", slug: "fe-500d-tmt-10mm", category: "steel", name: "TMT bar · Fe 500D · 10 mm", description: "Compare the same grade and diameter across dealer offers before acceptance.", brand: "JSW Neosteel", specifications: [{ label: "Grade", value: "Fe 500D (verify SKU)" }, { label: "Diameter", value: "10 mm" }, { label: "Typical unit", value: "kg / quintal / tonne" }, { label: "Supply note", value: "Theoretical weight is not actual weighed supply" }] },
  { verification: "reference", slug: "opc-cement-53-grade", category: "cement", name: "OPC cement · 53 grade", description: "A discovery example only; confirm the actual brand SKU, suitability and documents.", brand: "ACC", specifications: [{ label: "Type", value: "OPC (verify product range)" }, { label: "Grade", value: "53 grade (verify SKU)" }, { label: "Typical unit", value: "50 kg bag, where applicable" }, { label: "Selection", value: "Use product documents and professional advice" }] },
  { verification: "reference", slug: "aac-block-600x200", category: "bricks-blocks", name: "AAC block · 600 × 200 mm", description: "Check thickness, density, strength data and local delivery/breakage terms.", brand: "Dealer-listed brand", specifications: [{ label: "Format", value: "AAC block" }, { label: "Face size", value: "Illustrative 600 × 200 mm" }, { label: "Typical unit", value: "piece / cubic metre" }, { label: "Delivery", value: "Pallet and shortage terms need confirmation" }] },
  { verification: "reference", slug: "red-clay-brick", category: "bricks-blocks", name: "Red clay brick", description: "Ask for actual dimensions, strength attributes and shortage/breakage policy.", brand: "Local manufacturer", specifications: [{ label: "Material", value: "Fired clay" }, { label: "Dimensions", value: "Confirm supplied batch" }, { label: "Typical unit", value: "piece / thousand pieces" }, { label: "Delivery", value: "Vehicle quantity and unloading need confirmation" }] },
  { verification: "reference", slug: "cpvc-pipe-25mm", category: "plumbing", name: "CPVC pipe · 25 mm", description: "Match nominal size, schedule/pressure class and compatible fittings.", brand: "Astral", specifications: [{ label: "Material", value: "CPVC (verify application)" }, { label: "Nominal size", value: "25 mm" }, { label: "Pressure class", value: "Confirm SKU marking" }, { label: "Typical unit", value: "length / piece" }] },
  { verification: "reference", slug: "upvc-pipe-110mm", category: "plumbing", name: "uPVC drainage pipe · 110 mm", description: "Confirm wall thickness, standard marking and compatible fittings.", brand: "Supreme", specifications: [{ label: "Material", value: "uPVC" }, { label: "Nominal size", value: "110 mm" }, { label: "Application", value: "Drainage; verify exact SKU" }, { label: "Typical unit", value: "length / piece" }] },
  { verification: "reference", slug: "frls-wire-15sqmm", category: "electrical", name: "FRLS wire · 1.5 sq mm", description: "Check copper/aluminium conductor, insulation, length and relevant approval marks.", brand: "Polycab", specifications: [{ label: "Type", value: "FRLS (verify exact range)" }, { label: "Conductor size", value: "1.5 sq mm" }, { label: "Typical unit", value: "coil / metre" }, { label: "Safety", value: "Use a qualified electrician and product documentation" }] },
  { verification: "reference", slug: "conduit-pipe-20mm", category: "electrical", name: "Electrical conduit · 20 mm", description: "Confirm material, wall thickness, length and compatible accessories.", brand: "Finolex", specifications: [{ label: "Type", value: "Conduit (verify SKU)" }, { label: "Nominal size", value: "20 mm" }, { label: "Typical unit", value: "length / bundle" }, { label: "Compatibility", value: "Check bends, couplers and junction boxes" }] },
  { verification:"reference", slug:"tata-tiscon-550sd-range",category:"steel",name:"Tata Tiscon 550SD TMT rebar",brand:"Tata Tiscon",description:"Manufacturer has a 550SD TMT range; confirm diameter, BIS batch markings, official product identity, lengths and actual dealer supply.",manufacturerReference:"https://tatatiscon.co.in/tata-tiscon-550sd-tmt-rebar/",manufacturerSku:null,specifications:[{label:"Manufacturer range",value:"550SD"},{label:"Standards/grade",value:"Fe 550D; confirm mill test report"},{label:"Diameter",value:"Select exact size in dealer quotation"},{label:"Unit",value:"Kg or tonne; weighbridge proof where applicable"}] },
  { verification:"reference", slug:"astral-cpvc-pro-range",category:"plumbing",name:"Astral CPVC PRO pipe system",brand:"Astral",description:"Real Astral CPVC PRO range reference. Confirm exact pipe size, pressure rating, class, original printed marking and fitting compatibility.",manufacturerReference:"https://www.astralpipes.com/plumbing-pipes-fittings/cpvc-pro-pipes/",manufacturerSku:null,specifications:[{label:"Product family",value:"CPVC PRO"},{label:"Nominal size",value:"Choose exact printed size"},{label:"Pressure / schedule",value:"Verify manufacturer variant"},{label:"Typical unit",value:"length / piece"}] },
  { verification:"reference", slug:"emulsion-interior-brand-quote",category:"paint",name:"Interior emulsion paint · brand selection",brand:"Asian Paints / Berger / Nerolac",description:"Select manufacturer and interior/exterior purpose after verifying exact SKU, finish, shade card and product coverage with an approved seller.",manufacturerSku:null,specifications:[{label:"Finish",value:"Matte / sheen / washable (verify SKU)"},{label:"Pack",value:"Confirm litre pack size"},{label:"Colour",value:"Physical shade card required"},{label:"Estimate",value:"Coats, primer and surface preparation affect litres"}] },
  { verification:"reference", slug:"exterior-waterproofing-system",category:"paint",name:"Terrace and exterior waterproofing system",brand:"Dr. Fixit / Asian Paints",description:"Describe substrate, wet area, coating compatibility and manufacturer instructions; product identification and quantity require site inspection.",manufacturerSku:null,specifications:[{label:"Application",value:"Terrace / bathroom / wall — specify"},{label:"Unit",value:"litre / kg by confirmed product"},{label:"System",value:"Primer, membrane, coatings may be separate"},{label:"Safety",value:"Follow data sheet and recommended contractor"}] },
  { verification:"reference", slug:"vitrified-tile-600x600",category:"tiles",name:"Vitrified floor tile · 600 × 600 mm",brand:"Kajaria / Somany",description:"Generic size-and-material request; confirm exact collection, tile slip resistance, shade batch, rectification, thickness and boxes.",manufacturerSku:null,specifications:[{label:"Format",value:"600 × 600 mm reference format"},{label:"Surface",value:"Matte / glossy; manufacturer SKU needed"},{label:"Unit",value:"box / square foot"},{label:"Quantity",value:"Account for cutting waste and extra cartons"}] },
  { verification:"reference", slug:"wall-tile-300x600",category:"tiles",name:"Ceramic wall tile · 300 × 600 mm",brand:"Somany / Orientbell",description:"Reference size only, not a guaranteed brand SKU. Check shade lot, thickness, breakage policy, grout and adhesive suitability.",manufacturerSku:null,specifications:[{label:"Size",value:"300 × 600 mm reference"},{label:"Unit",value:"box / square foot"},{label:"Finish",value:"Confirm finish and edge profile"}] },
  { verification:"reference", slug:"tile-adhesive-c2",category:"hardware",name:"Tile adhesive · application-based",brand:"Roff / MYK Laticrete",description:"Select suitable adhesive class for the specific tile, substrate, wet area and local application conditions.",manufacturerSku:null,specifications:[{label:"Adhesive grade",value:"Confirm manufacturer's exact standard/class"},{label:"Unit",value:"bag"},{label:"Coverage",value:"Depends on trowel, substrate and tile"}] },
  { verification:"reference", slug:"door-hinge-stainless-steel",category:"hardware",name:"Stainless steel door hinge · size selection",brand:"Godrej / Ebco",description:"Compare manufacturer, metal grade, load rating, hole pattern, bearing type and finish; exact variant pending verification.",manufacturerSku:null,specifications:[{label:"Material",value:"Stainless steel (confirm grade)"},{label:"Size",value:"4 in / 5 in reference options"},{label:"Unit",value:"piece / pair"},{label:"Compatibility",value:"Door thickness and loading require confirmation"}] },
];

const directoryReferences = [
  { name: "Tata Tiscon", category: "steel", note: "TMT discovery example" },
  { name: "JSW Neosteel", category: "steel", note: "TMT discovery example" },
  { name: "Jindal Panther", category: "steel", note: "TMT discovery example" },
  { name: "SAIL", category: "steel", note: "TMT discovery example" },
  { name: "UltraTech", category: "cement", note: "Cement discovery example" },
  { name: "ACC", category: "cement", note: "Cement discovery example" },
  { name: "Ambuja", category: "cement", note: "Cement discovery example" },
  { name: "JK Cement", category: "cement", note: "Cement discovery example" },
  { name: "Dalmia", category: "cement", note: "Cement discovery example" },
  { name: "Shree Cement", category: "cement", note: "Cement discovery example" },
  { name: "Astral", category: "plumbing", note: "Pipes discovery example" },
  { name: "Supreme", category: "plumbing", note: "Pipes discovery example" },
  { name: "Finolex", category: "electrical", note: "Electrical discovery example" },
  { name: "Polycab", category: "electrical", note: "Electrical discovery example" },
];

// Keep editorial directory entries and include every brand with a sourced product.
export const brandDirectory = [...directoryReferences];
for (const {brand,category} of sourcedProducts) {
  if (!brandDirectory.some(entry=>entry.category===category && entry.name===brand)) {
    brandDirectory.push({name:brand,category,note:"Product specifications available"});
  }
}

export function brandDestination(name:string,category:string) {
  const listed=demoProducts.some(product=>product.brand===name && product.category===category);
  if (listed) return "/materials?"+new URLSearchParams({brand:name,category})+"#catalog-results";
  return "/quotes?"+new URLSearchParams({category,material:name+" "+category});
}

export const getCategory = (slug: string) => catalogCategories.find((category) => category.slug === slug);
export const getProductsByCategory = (slug: string) => demoProducts.filter((product) => product.category === slug);
export const getProduct = (category: string, slug: string) => demoProducts.find((product) => product.category === category && product.slug === (category==="cement"&&slug==="ultratech-ppc-range"?"ppc-cement-50kg":slug));
