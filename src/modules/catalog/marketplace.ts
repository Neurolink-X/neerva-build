import { catalogCategories } from "@/modules/catalog/catalog";

export type DemoProduct = {
  images?: string[];
  slug: string;
  category: string;
  name: string;
  description: string;
  brand: string;
  specifications: { label: string; value: string }[];
  quoteOnly?: boolean;
};

// Brand names and examples help discovery only. There is no claim of dealer
// authorization, live inventory, certification, or a current selling price.
export const demoProducts: DemoProduct[] = [
  { slug: "fe-500d-tmt-12mm", category: "steel", name: "TMT bar · Fe 500D · 12 mm", description: "Illustrative product profile. Confirm the exact manufacturer range and test documents with the supplying dealer.", brand: "Tata Tiscon", specifications: [{ label: "Grade", value: "Fe 500D (verify SKU)" }, { label: "Diameter", value: "12 mm" }, { label: "Typical unit", value: "kg / quintal / tonne" }, { label: "Supply note", value: "Actual weight and bundle details must be confirmed" }] },
  { slug: "fe-500d-tmt-10mm", category: "steel", name: "TMT bar · Fe 500D · 10 mm", description: "Compare the same grade and diameter across dealer offers before acceptance.", brand: "JSW Neosteel", specifications: [{ label: "Grade", value: "Fe 500D (verify SKU)" }, { label: "Diameter", value: "10 mm" }, { label: "Typical unit", value: "kg / quintal / tonne" }, { label: "Supply note", value: "Theoretical weight is not actual weighed supply" }] },
  { slug: "ppc-cement-50kg", category: "cement", name: "PPC cement · 50 kg bag", description: "Confirm product type, grade, packing and fresh stock for the selected brand.", brand: "UltraTech", specifications: [{ label: "Type", value: "PPC (verify product range)" }, { label: "Pack size", value: "50 kg, where applicable" }, { label: "Typical unit", value: "bag" }, { label: "Storage", value: "Keep dry and follow manufacturer guidance" }] },
  { slug: "opc-cement-53-grade", category: "cement", name: "OPC cement · 53 grade", description: "A discovery example only; confirm the actual brand SKU, suitability and documents.", brand: "ACC", specifications: [{ label: "Type", value: "OPC (verify product range)" }, { label: "Grade", value: "53 grade (verify SKU)" }, { label: "Typical unit", value: "50 kg bag, where applicable" }, { label: "Selection", value: "Use product documents and professional advice" }] },
  { slug: "aac-block-600x200", category: "bricks-blocks", name: "AAC block · 600 × 200 mm", description: "Check thickness, density, strength data and local delivery/breakage terms.", brand: "Dealer-listed brand", specifications: [{ label: "Format", value: "AAC block" }, { label: "Face size", value: "Illustrative 600 × 200 mm" }, { label: "Typical unit", value: "piece / cubic metre" }, { label: "Delivery", value: "Pallet and shortage terms need confirmation" }] },
  { slug: "red-clay-brick", category: "bricks-blocks", name: "Red clay brick", description: "Ask for actual dimensions, strength attributes and shortage/breakage policy.", brand: "Local manufacturer", specifications: [{ label: "Material", value: "Fired clay" }, { label: "Dimensions", value: "Confirm supplied batch" }, { label: "Typical unit", value: "piece / thousand pieces" }, { label: "Delivery", value: "Vehicle quantity and unloading need confirmation" }] },
  { slug: "cpvc-pipe-25mm", category: "plumbing", name: "CPVC pipe · 25 mm", description: "Match nominal size, schedule/pressure class and compatible fittings.", brand: "Astral", specifications: [{ label: "Material", value: "CPVC (verify application)" }, { label: "Nominal size", value: "25 mm" }, { label: "Pressure class", value: "Confirm SKU marking" }, { label: "Typical unit", value: "length / piece" }] },
  { slug: "upvc-pipe-110mm", category: "plumbing", name: "uPVC drainage pipe · 110 mm", description: "Confirm wall thickness, standard marking and compatible fittings.", brand: "Supreme", specifications: [{ label: "Material", value: "uPVC" }, { label: "Nominal size", value: "110 mm" }, { label: "Application", value: "Drainage; verify exact SKU" }, { label: "Typical unit", value: "length / piece" }] },
  { slug: "frls-wire-15sqmm", category: "electrical", name: "FRLS wire · 1.5 sq mm", description: "Check copper/aluminium conductor, insulation, length and relevant approval marks.", brand: "Polycab", specifications: [{ label: "Type", value: "FRLS (verify exact range)" }, { label: "Conductor size", value: "1.5 sq mm" }, { label: "Typical unit", value: "coil / metre" }, { label: "Safety", value: "Use a qualified electrician and product documentation" }] },
  { slug: "conduit-pipe-20mm", category: "electrical", name: "Electrical conduit · 20 mm", description: "Confirm material, wall thickness, length and compatible accessories.", brand: "Finolex", specifications: [{ label: "Type", value: "Conduit (verify SKU)" }, { label: "Nominal size", value: "20 mm" }, { label: "Typical unit", value: "length / bundle" }, { label: "Compatibility", value: "Check bends, couplers and junction boxes" }] },
  { slug: "river-sand-bulk", category: "aggregates", name: "Sand / balu · bulk request", description: "No public fixed rate. Ask for a private quote with location, quantity and transport terms.", brand: "Dealer response required", specifications: [{ label: "Material", value: "Specify source/type and intended use" }, { label: "Quantity", value: "Truck / cubic metre / other agreed unit" }, { label: "Delivery", value: "Pincode, freight and schedule to be confirmed" }, { label: "Before acceptance", value: "Review all charges and applicable documents" }], quoteOnly: true },
  { slug: "crushed-aggregate-bulk", category: "aggregates", name: "Crushed aggregate · bulk request", description: "No public fixed rate. Confirm aggregate size, quantity, freight and required documents.", brand: "Dealer response required", specifications: [{ label: "Material", value: "Specify size/grade" }, { label: "Quantity", value: "Truck / tonne / cubic metre" }, { label: "Delivery", value: "Confirm vehicle, access and unloading" }, { label: "Before acceptance", value: "Review final itemized quote" }], quoteOnly: true },
];

export const brandDirectory = [
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

export const getCategory = (slug: string) => catalogCategories.find((category) => category.slug === slug);
export const getProductsByCategory = (slug: string) => demoProducts.filter((product) => product.category === slug);
export const getProduct = (category: string, slug: string) => demoProducts.find((product) => product.category === category && product.slug === slug);
