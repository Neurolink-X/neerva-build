import type {DemoProduct} from "./marketplace.ts";

// Retail listing references describe product choices. Seller availability and prices come from Neerva separately.
const listings: [string,string,string,string,string,string,string][] = [
  ["acc-suraksha-power-ppc-cement-50-kg-bag", "cement", "ACC", "Adani ACC Suraksha Power PPC Cement, 50 Kg Bag", "PPC", "50 kg bag", "Packing date and batch number"],
  ["ultratech-ppc-cement", "cement", "UltraTech", "Ultratech PPC Cement, 50 Kg Bag", "PPC", "50 kg bag", "Packing date and batch number"],
  ["generic-p-sand-plastering-sand-triple-washed-30kg-bag-professional-construction-landscaping-grade", "aggregates", "TRUEGRIT", "TRUEGRIT Triple Washed M-Sand (Plastering Grade / P-Sand) – 25kg Bag", "Washed plastering sand", "25 kg bag", "Grading and delivery charges"],
  ["priya-ppc-cement", "cement", "Priya", "Priya PPC Cement, 50 Kg Bag", "PPC", "50 kg bag", "Packing date and batch number"],
  ["maha-ppc-cement", "cement", "Maha", "Maha PPC Cement, 50 Kg Bag", "PPC", "50 kg bag", "Packing date and batch number"],
  ["ramco-supergrade-ppc-cement", "cement", "Ramco", "Ramco Supergrade PPC Cement, 50 Kg Bag", "PPC", "50 kg bag", "Packing date and batch number"],
  ["maha-opc-53-cement", "cement", "Maha", "Maha Cement OPC 53 Grade Cement, 50 Kg Bag", "OPC 53", "50 kg bag", "Packing date and batch number"],
  ["birla-super-opc53-cement", "cement", "Birla Super", "Birla Super OPC 53 Grade Cement, 50 Kg Bag", "OPC 53", "50 kg bag", "Packing date and batch number"],
  ["priya-opc53-grade-cement", "cement", "Priya", "Priya OPC 53 Grade Cement, 50 Kg Bag", "OPC 53", "50 kg bag", "Packing date and batch number"],
  ["ramco-opc53-grade-cement", "cement", "Ramco", "Ramco Cement OPC 53 Grade, 50 Kg Bag", "OPC 53", "50 kg bag", "Packing date and batch number"],
  ["jsw-aac-block-adhesive-block-grip-40-kg-bag-1", "hardware", "JSW", "JSW Block Grip AAC Block Jointing Mortar/Adhesive, 40 Kg Bag", "AAC jointing mortar", "40 kg", "Substrate and application"],
  ["kohinoor-waste-pvc-pipe-32mm", "plumbing", "Kohinoor", "Kohinoor Sink Waste PVC Pipe, 32mm", "Sink waste PVC pipe", "32 mm", "Waste coupling and drain connection"],
  ["kei-homecab-90mtr-wire", "electrical", "KEI", "KEI Homecab FR Wire, 90m", "FR", "90 m", "Conductor cross-section and colour"],
  ["anchor-panasonic-advance-fr-wire", "electrical", "Anchor Panasonic", "Anchor Panasonic Advance FR Wire, 90m", "FR", "90 m", "Conductor cross-section and colour"],
  ["anchor-panasonic-fireguard-fr-lsh-wire", "electrical", "Anchor Panasonic", "Anchor Panasonic Fireguard FR-LSH Wire, 180m", "FR-LSH", "180 m", "Conductor cross-section and colour"],
  ["asian-paints-tractor-emulsion", "paint", "Asian Paints", "Asian Paints Tractor Emulsion, Base White", "Tractor Emulsion", "Base white", "Tint code and pack volume"],
  ["asian-paints-ace-base-white", "paint", "Asian Paints", "Asian Paints Ace Exterior Emulsion, Base White", "Exterior emulsion", "Base white", "Tint code and pack volume"],
  ["asian-paints-apex-base-white", "paint", "Asian Paints", "Asian Paints Apex Dust Proof Exterior Emulsion, Base White", "Exterior emulsion", "Base white", "Tint code and pack volume"],
  ["hettich-slide-on-3447-non-silent-hinge-regular-close", "hardware", "Hettich", "Hettich Slide On 3447 Non-Silent Hinge, Regular Close", "Regular close", "3447 slide-on", "Mounting plate and door overlay"],
  ["hettich-0-crank-soft-close-hinges-25mm-9281432", "hardware", "Hettich", "Hettich Onsys 4447i Soft Close Hinges, 1 Set (2 Nos)", "Soft close", "Pair", "Mounting plate and door overlay"],
  ["ebco-slip-on-hinge-euro-regular-close-hinges-1-set-2-nos", "hardware", "Ebco", "Ebco Slip On Hinge, Regular Close, 1 Set (2 Nos)", "Regular close", "Pair", "Mounting plate and door overlay"],
  ["myk-laticrete-dwa-215-tile-adhesive-10-kg", "hardware", "MYK Laticrete", "MYK Laticrete DWA 215 Tile Adhesive, 10 Kg", "Tile adhesive", "10 kg", "Substrate and application"],
  ["myk-laticrete-305-tile-adhesive-30kg", "hardware", "MYK Laticrete", "MYK Laticrete 305 Tile Adhesive, Grey, 30 Kg Bag", "Tile adhesive", "30 kg", "Substrate and application"],
];
export const sourcedProducts:DemoProduct[]=listings.map(([handle,category,brand,name,kind,variant,check])=>({
 slug:handle==="ultratech-ppc-cement"?"ppc-cement-50kg":handle,
 name,brand,category,verification:"reference",quoteOnly:category==="aggregates",
 description:`Compare ${kind} options by ${brand}. Confirm ${check.toLowerCase()} in your quote.`,
 referenceImage:`/images/catalog/reference/${handle}.webp`,
 referenceSource:`https://home-run.co/products/${handle}`,
 specifications:[{label:"Type",value:kind},{label:"Pack / variant",value:variant},{label:"Confirm with dealer",value:check}]
}));

const steelSizes=[[8,.395],[10,.617],[12,.888],[16,1.58],[20,2.47],[25,3.85]] as const;
for(const [diameter,mass] of steelSizes){
 sourcedProducts.push({
  slug:`jsw-neosteel-550d-${diameter}mm`,name:`JSW Neosteel Fe 550D · ${diameter} mm`,category:"steel",brand:"JSW Neosteel",
  verification:"reference",description:"Compare nominal mass per metre. The quotation should confirm bar length, bundle count and actual supplied weight.",
  manufacturerReference:"https://www.jswneosteel.in/products/jsw-neosteel-500-d.aspx",
  referenceImage:"/images/catalog/reference/jsw-550d-range.webp",
  specifications:[{label:"Grade",value:"Fe 550D"},{label:"Diameter",value:diameter+" mm"},{label:"Nominal mass",value:mass+" kg/m"}]
 });
}

for(const thickness of [75,100,150,200,225]){
 sourcedProducts.push({
  slug:`magicrete-aac-${thickness}mm`,name:`Magicrete AAC block · ${thickness} mm`,brand:"Magicrete",category:"bricks-blocks",
  verification:"reference",description:"Compare wall thickness and request the block count, transport and unloading terms for your site.",
  referenceImage:"/images/catalog/reference/magicrete-aac.webp",
  manufacturerReference:"https://www.magicrete.in/assets/uploads/2026/01/brochure/aac-block-data-sheet-web_1769680331.pdf",
  specifications:[{label:"Material",value:"Autoclaved aerated concrete"},{label:"Face size",value:"600 × 200 mm"},{label:"Thickness",value:thickness+" mm"}]
 });
}
sourcedProducts.push({
 slug:"kajaria-k-12631",name:"Kajaria K 12631 · 600 × 1200 mm",brand:"Kajaria",category:"tiles",verification:"reference",
 description:"Compare the pattern at full tile size. Request the shade lot, carton coverage and breakage terms before ordering.",
 referenceImage:"/images/catalog/reference/kajaria-k-12631.webp",
 manufacturerReference:"https://www.kajariaceramics.com/products/K-12631-600x1200-mm",
 specifications:[{label:"Design",value:"K 12631"},{label:"Format",value:"600 × 1200 mm"},{label:"Type",value:"Polished vitrified tile"}]
});

const plumbingReferences = [
  ["ashirvad-cpvc-half","ashirvad-pipe","SDR-11 pipe","½ inch","5 m length",305],
  ["ashirvad-cpvc-three-quarter","ashirvad-pipe","SDR-11 pipe","¾ inch","5 m length",375],
  ["ashirvad-cpvc-one","ashirvad-pipe","SDR-11 pipe","1 inch","5 m length",590],
  ["ashirvad-cpvc-one-quarter","ashirvad-pipe","SDR-11 pipe","1¼ inch","5 m length",1099],
  ["ashirvad-elbow-half","ashirvad-elbow","45° elbow","½ inch","fitting",19],
  ["ashirvad-threaded-tee-half","ashirvad-tee","Brass threaded tee","½ × ½ inch","fitting",87]
] as const;
for (const [slug,image,kind,size,unit,price] of plumbingReferences) {
  sourcedProducts.push({
    slug, category:"plumbing", brand:"Ashirvad", verification:"reference",
    name:`Ashirvad FlowGuard Plus CPVC ${kind} · ${size}`,
    description:"Check nominal size, connection type and required quantity against your plumbing schedule.",
    referenceImage:`/images/catalog/reference/${image}.webp`,
    referenceSource:"https://home-run.co/pages/price-list/pipes-plumbing",
    specifications:[{label:"Product family",value:`FlowGuard Plus CPVC ${kind}`},
      {label:"Nominal size",value:size},{label:"Bengaluru retail reference · May 2026",value:`₹${price} / ${unit}`}]
  });
}
const tileReferences = [
  ["orientbell-star","DGVT NEXA Star White","600 × 600 mm","Vitrified","dgvt-nexa-star-white-025606663250565361m",95],
  ["orientbell-opal","FT Opal Crema","600 × 600 mm","Porcelain","ft-opal-crema-024606654091098361m",85],
  ["orientbell-oak","DR DGVT Lugano Oak Wood Ivory","200 × 1200 mm","Glazed vitrified plank","dr-dgvt-lugano-oak-wood-ivory",null]
] as const;
for (const [slug,model,size,material,handle,mrp] of tileReferences) {
  sourcedProducts.push({
    slug, category:"tiles", brand:"Orientbell", verification:"reference",
    name:`Orientbell ${model}`, description:"Confirm carton coverage, shade lot, stock and delivered price with your dealer.",
    manufacturerReference:`https://www.orientbell.com/${handle}`,
    referenceImage:`/images/catalog/reference/${slug}.webp`,
    specifications:[{label:"Format",value:size},{label:"Material",value:material},{label:"Finish",value:"Matte"},
      ...(mrp?[{label:"Manufacturer MRP",value:`₹${mrp} / sq ft`}]:[])]
  });
}
