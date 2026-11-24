export type HardwareGroup="adhesives"|"tiling"|"sealants"|"doors"|"furniture"|"windows"|"tools"|"protection";
export type HardwareRef={slug:string;brand:string;name:string;group:HardwareGroup;pack:string;application:string;rupees:number|null;source:string|null;image?:string;priceVariant?:string};
export const hardwareGroups:Record<HardwareGroup,string>={adhesives:"Tile & block adhesives",tiling:"Grout & tiling accessories",sealants:"Adhesives & sealants",doors:"Door fittings & locks",furniture:"Furniture & cabinet fittings",windows:"Window fittings",tools:"Site tools",protection:"Surface protection"};
export const hardwareReferences:HardwareRef[]=[
  {
    "slug": "roff-t01-nca",
    "brand": "Roff",
    "name": "T01 NCA grey tile adhesive",
    "group": "adhesives",
    "pack": "30 kg bag",
    "application": "New construction tile fixing; confirm tile size and substrate",
    "rupees": 430,
    "source": "https://home-run.co/collections/tiling",
    "image": "https://home-run.co/cdn/shop/files/1_Front_shot_Main_Images_e04ff06f-e6a8-435c-af91-e637997ea7cb.webp?v=1775547723&width=533"
  },
  {
    "slug": "myk-303-grey",
    "brand": "MYK Laticrete",
    "name": "303 grey tile adhesive",
    "group": "adhesives",
    "pack": "20 kg bag",
    "application": "Tile bonding; confirm substrate, mix and open time",
    "rupees": 255,
    "source": "https://home-run.co/collections/tiling",
    "image": "https://home-run.co/cdn/shop/files/L_303_20_Kg_Bag-1_1.png?v=1782467004&width=533"
  },
  {
    "slug": "myk-335-white",
    "brand": "MYK Laticrete",
    "name": "335 Super Flex white tile & stone adhesive",
    "group": "adhesives",
    "pack": "20 kg bag",
    "application": "Stone and tile fixing; confirm stone compatibility",
    "rupees": 1360,
    "source": "https://home-run.co/collections/tiling",
    "image": "https://home-run.co/cdn/shop/files/1_MYK_Laticrete_335_white_main_image_ef88eb98-e49a-4b1b-93b2-cfe308fb5f4b.webp?v=1775651853&width=533"
  },
  {
    "slug": "birla-tx1-white",
    "brand": "Birla White",
    "name": "TX1 white tile adhesive",
    "group": "adhesives",
    "pack": "20 kg bag",
    "application": "Confirm tile type, substrate and coverage",
    "rupees": 299,
    "source": "https://home-run.co/collections/tiling",
    "image": "https://home-run.co/cdn/shop/files/1_Birla_white_tilestix_intero_main_image.webp?v=1776256757&width=533"
  },
  {
    "slug": "roff-t02-nsa",
    "brand": "Roff",
    "name": "T02 NSA grey tile adhesive",
    "group": "adhesives",
    "pack": "30 kg bag",
    "application": "Tile-on-tile and suitable vitrified applications per datasheet",
    "rupees": 740,
    "source": "https://home-run.co/collections/tiling",
    "image": "https://home-run.co/cdn/shop/files/1_Front_shot_Main_Images_3450099b-7c50-4409-bf9f-8be2f2cc0db7.webp?v=1775548277&width=533"
  },
  {
    "slug": "roff-t09-nsa",
    "brand": "Roff",
    "name": "T09 NSA white tile adhesive",
    "group": "adhesives",
    "pack": "20 kg bag",
    "application": "Confirm stone staining risk and substrate compatibility",
    "rupees": 615,
    "source": "https://home-run.co/collections/tiling",
    "image": "https://home-run.co/cdn/shop/files/1_Front_shot_Main_Images_1b3877a3-e136-4bfa-8c32-392ae92b9049.webp?v=1775554742&width=533"
  },
  {
    "slug": "smartcare-tile-adhesive",
    "brand": "Asian Paints",
    "name": "SmartCare grey tile adhesive",
    "group": "adhesives",
    "pack": "30 kg bag",
    "application": "Confirm adhesive classification and tile format",
    "rupees": 370,
    "source": "https://home-run.co/collections/tiling",
    "image": "https://home-run.co/cdn/shop/files/1_Asian_paints_smartcare_tile_adhesive_main_image_2a82f83a-beee-41ec-91ab-c4947f58aa03.webp?v=1775652447&width=533"
  },
  {
    "slug": "roff-t03-vfa",
    "brand": "Roff",
    "name": "T03 VFA grey tile adhesive",
    "group": "adhesives",
    "pack": "20 kg bag",
    "application": "Confirm substrate and tile format before use",
    "rupees": 650,
    "source": "https://home-run.co/collections/tiling",
    "image": "https://home-run.co/cdn/shop/files/1_Front_shot_Main_Images_1f13cee6-6f84-4c14-8adb-83f7c9ddd945.webp?v=1775548958&width=533"
  },
  {
    "slug": "myk-315-plus",
    "brand": "MYK Laticrete",
    "name": "315 Plus tile adhesive",
    "group": "adhesives",
    "pack": "20 kg bag; grey or white",
    "application": "Match colour and tile requirements",
    "rupees": 625,
    "source": "https://home-run.co/collections/tiling",
    "image": "https://home-run.co/cdn/shop/files/1_MYK_Laticrete_315_grey_main_image_4808f9df-050b-41b2-aa60-3fe2fee8d8dd.webp?v=1775556983&width=533",
    "priceVariant": "Grey pack only"
  },
  {
    "slug": "birla-tx2-white",
    "brand": "Birla White",
    "name": "TX2 white tile adhesive",
    "group": "adhesives",
    "pack": "20 kg bag",
    "application": "Confirm format, wall/floor suitability and coverage",
    "rupees": 510,
    "source": "https://home-run.co/collections/tiling",
    "image": "https://home-run.co/cdn/shop/files/Main_image_Birla_white_tilestix_intero.webp?v=1774264950&width=533"
  },
  {
    "slug": "roff-t20-ultra",
    "brand": "Roff",
    "name": "T20 Extrofix Ultra white adhesive",
    "group": "adhesives",
    "pack": "20 kg bag",
    "application": "Confirm exterior system and tile weight",
    "rupees": 1380,
    "source": "https://home-run.co/collections/tiling"
  },
  {
    "slug": "roff-t04-vfa",
    "brand": "Roff",
    "name": "T04 VFA white adhesive",
    "group": "adhesives",
    "pack": "20 kg bag",
    "application": "Verify tile type and surface preparation",
    "rupees": 755,
    "source": "https://home-run.co/collections/tiling"
  },
  {
    "slug": "myk-sp100-grout",
    "brand": "MYK Laticrete",
    "name": "SP-100 epoxy grout system",
    "group": "tiling",
    "pack": "Resin, hardener and colour component",
    "application": "Order all compatible components; confirm joint width",
    "rupees": null,
    "source": "https://home-run.co/collections/tiling"
  },
  {
    "slug": "roff-t34-grout",
    "brand": "Roff",
    "name": "T34 Starlike epoxy grout",
    "group": "tiling",
    "pack": "Pack size and colour to confirm",
    "application": "Tile joints; check joint width and cleaning method",
    "rupees": null,
    "source": "https://home-run.co/collections/tiling"
  },
  {
    "slug": "roff-tile-spacers",
    "brand": "Roff",
    "name": "Tile spacers",
    "group": "tiling",
    "pack": "100 pieces per pack; size to confirm",
    "application": "Maintain consistent joint spacing",
    "rupees": null,
    "source": "https://home-run.co/collections/tiling"
  },
  {
    "slug": "tile-leveling-system",
    "brand": "Local supplier",
    "name": "Tile leveling clips and reusable wedges",
    "group": "tiling",
    "pack": "Clip height, joint width and pack count",
    "application": "Reduce lippage during installation; match tile thickness",
    "rupees": null,
    "source": null
  },
  {
    "slug": "notched-trowel",
    "brand": "Local supplier",
    "name": "Notched tile adhesive trowel",
    "group": "tiling",
    "pack": "Notch size to suit tile and substrate",
    "application": "Spread adhesive uniformly per installation instructions",
    "rupees": null,
    "source": null
  },
  {
    "slug": "rubber-grout-float",
    "brand": "Local supplier",
    "name": "Rubber grout float",
    "group": "tiling",
    "pack": "Float size and rubber hardness",
    "application": "Apply grout without damaging tile surface",
    "rupees": null,
    "source": null
  },
  {
    "slug": "tile-grout-sponge",
    "brand": "Local supplier",
    "name": "Tile cleaning sponge",
    "group": "tiling",
    "pack": "Size and density to confirm",
    "application": "Clean grout residue following grout instructions",
    "rupees": null,
    "source": null
  },
  {
    "slug": "dowsil-789",
    "brand": "DOWSIL",
    "name": "789 silicone weatherproofing sealant",
    "group": "sealants",
    "pack": "280 ml cartridge",
    "application": "Weather joints; verify joint design and substrate",
    "rupees": 300,
    "source": "https://home-run.co/collections/general-hardware-tools",
    "image": "https://home-run.co/cdn/shop/files/DOWSIL_789_Silicone_Weather_Proofing_Sealant_280ml.jpg?v=1770112275&width=533"
  },
  {
    "slug": "fevikwik-203",
    "brand": "Pidilite",
    "name": "Fevikwik 203 instant adhesive",
    "group": "sealants",
    "pack": "20 g",
    "application": "Small compatible nonstructural repairs; follow SDS",
    "rupees": 55,
    "source": "https://home-run.co/collections/general-hardware-tools",
    "image": "https://home-run.co/cdn/shop/files/1_Fevikwik_203_20g_main_image_a2f0d7af-13df-49c5-a0a6-938cbd0f8d50.webp?v=1775710947&width=533"
  },
  {
    "slug": "wood-adhesive",
    "brand": "Local supplier",
    "name": "Woodworking PVA adhesive",
    "group": "sealants",
    "pack": "Grade and pack size to confirm",
    "application": "Join compatible timber and boards; moisture class matters",
    "rupees": null,
    "source": null
  },
  {
    "slug": "acrylic-gap-sealant",
    "brand": "Local supplier",
    "name": "Paintable acrylic gap sealant",
    "group": "sealants",
    "pack": "Cartridge volume and joint width",
    "application": "Interior nonstructural gaps; not a waterproof membrane",
    "rupees": null,
    "source": null
  },
  {
    "slug": "pu-joint-sealant",
    "brand": "Local supplier",
    "name": "Polyurethane construction joint sealant",
    "group": "sealants",
    "pack": "Cartridge or sausage pack",
    "application": "Movement joints; verify primer and movement rating",
    "rupees": null,
    "source": null
  },
  {
    "slug": "sealant-gun",
    "brand": "Local supplier",
    "name": "Manual cartridge sealant gun",
    "group": "tools",
    "pack": "Cartridge capacity and frame type",
    "application": "Apply compatible cartridge sealant",
    "rupees": null,
    "source": null
  },
  {
    "slug": "ebco-dv1",
    "brand": "Ebco",
    "name": "DV1 door viewer",
    "group": "doors",
    "pack": "25–60 mm door thickness; brushed steel",
    "application": "Door peephole; confirm bore and thickness",
    "rupees": 234,
    "source": "https://home-run.co/pages/price-list/door-hardware"
  },
  {
    "slug": "liftor-magnetic-stopper",
    "brand": "Liftor",
    "name": "Magnetic door stopper / catcher",
    "group": "doors",
    "pack": "Stainless steel finish",
    "application": "Hold door open; match fixing surface",
    "rupees": 286,
    "source": "https://home-run.co/pages/price-list/door-hardware"
  },
  {
    "slug": "ss-butt-hinge-3in",
    "brand": "Local supplier",
    "name": "Stainless steel butt hinge",
    "group": "doors",
    "pack": "3 inch; medium 16 gauge; SS finish",
    "application": "Match leaf weight, hinge count and screw pattern",
    "rupees": 34,
    "source": "https://home-run.co/pages/price-list/door-hardware"
  },
  {
    "slug": "door-pull-handle",
    "brand": "Local supplier",
    "name": "Door pull handle",
    "group": "doors",
    "pack": "Centre distance, finish and mounting type",
    "application": "Main and interior doors; match door thickness",
    "rupees": null,
    "source": null
  },
  {
    "slug": "door-al-drop",
    "brand": "Local supplier",
    "name": "Door aldrope latch",
    "group": "doors",
    "pack": "Length, finish and mounting plate",
    "application": "Manual door closure; verify alignment",
    "rupees": null,
    "source": null
  },
  {
    "slug": "door-closer",
    "brand": "Local supplier",
    "name": "Hydraulic door closer",
    "group": "doors",
    "pack": "Door width, weight and opening direction",
    "application": "Controlled closing; certified fire door assemblies require approved hardware",
    "rupees": null,
    "source": null
  },
  {
    "slug": "door-floor-spring",
    "brand": "Local supplier",
    "name": "Floor spring door closer",
    "group": "doors",
    "pack": "Door weight, pivot and opening angle",
    "application": "Glass or timber doors; professional installation",
    "rupees": null,
    "source": null
  },
  {
    "slug": "door-mortise-lock",
    "brand": "Local supplier",
    "name": "Mortise lock and lever handle set",
    "group": "doors",
    "pack": "Backset, cylinder and door thickness",
    "application": "Interior or entrance door; match lockcase and handedness",
    "rupees": null,
    "source": null
  },
  {
    "slug": "godrej-cylindrical-keyless",
    "brand": "Godrej",
    "name": "Stainless steel cylindrical lock",
    "group": "doors",
    "pack": "Keyless variant",
    "application": "Privacy door hardware; verify backset",
    "rupees": 801,
    "source": "https://home-run.co/collections/door-locks-hardware"
  },
  {
    "slug": "europa-drawer-lock",
    "brand": "Europa",
    "name": "Cupboard / drawer lock",
    "group": "furniture",
    "pack": "16 or 20 mm panel; finish to confirm",
    "application": "Lockable cabinetry; confirm panel thickness",
    "rupees": null,
    "source": "https://home-run.co/collections/door-locks-hardware"
  },
  {
    "slug": "ebco-drawer-slide",
    "brand": "Ebco",
    "name": "Telescopic drawer slide",
    "group": "furniture",
    "pack": "Length, extension and load rating to confirm",
    "application": "Cabinet drawer; select matching pair and clearance",
    "rupees": null,
    "source": "https://dashboard.ebco.in/product-category/ebco/drawer-slides-and-hinges/drawer-slides/"
  },
  {
    "slug": "cabinet-pull-handle",
    "brand": "Local supplier",
    "name": "Cabinet pull handle",
    "group": "furniture",
    "pack": "Hole centre spacing and finish",
    "application": "Kitchen and wardrobe shutters; measure drilling distance",
    "rupees": null,
    "source": null
  },
  {
    "slug": "cabinet-knob",
    "brand": "Local supplier",
    "name": "Cabinet knob",
    "group": "furniture",
    "pack": "Diameter and thread length",
    "application": "Furniture doors; verify panel thickness",
    "rupees": null,
    "source": null
  },
  {
    "slug": "cabinet-magnetic-catch",
    "brand": "Local supplier",
    "name": "Magnetic cabinet catch",
    "group": "furniture",
    "pack": "Holding force and mount type",
    "application": "Keep cabinet door closed; match strike position",
    "rupees": null,
    "source": null
  },
  {
    "slug": "wardrobe-rod-support",
    "brand": "Local supplier",
    "name": "Wardrobe rod and supports",
    "group": "furniture",
    "pack": "Rod diameter, length and load rating",
    "application": "Clothing rail; match end and centre supports",
    "rupees": null,
    "source": null
  },
  {
    "slug": "window-friction-stay",
    "brand": "Local supplier",
    "name": "Window friction stay hinge",
    "group": "windows",
    "pack": "Stay length, sash weight and orientation",
    "application": "Casement window operation; match frame profile",
    "rupees": null,
    "source": null
  },
  {
    "slug": "window-latch",
    "brand": "Local supplier",
    "name": "Window sash latch",
    "group": "windows",
    "pack": "Frame profile and finish",
    "application": "Secure window sash; verify fixing geometry",
    "rupees": null,
    "source": null
  },
  {
    "slug": "sliding-window-roller",
    "brand": "Local supplier",
    "name": "Sliding window roller",
    "group": "windows",
    "pack": "Wheel diameter and track profile",
    "application": "Replacement sliding sash roller; match load",
    "rupees": null,
    "source": null
  },
  {
    "slug": "window-weather-strip",
    "brand": "Local supplier",
    "name": "Window weather strip",
    "group": "windows",
    "pack": "Profile and seal dimensions",
    "application": "Reduce air and dust leakage; measure frame gap",
    "rupees": null,
    "source": null
  },
  {
    "slug": "freemans-5m-tape",
    "brand": "Freemans",
    "name": "5 m measuring tape",
    "group": "tools",
    "pack": "5 metre",
    "application": "Site measurement; verify accuracy and blade condition",
    "rupees": 105,
    "source": "https://home-run.co/collections/general-hardware-tools",
    "image": "https://home-run.co/cdn/shop/files/gorilla_measuring_tape.webp?v=1783086007&width=533"
  },
  {
    "slug": "haks-plaster-trowel",
    "brand": "Haks",
    "name": "Plaster trowel / gurmala",
    "group": "tools",
    "pack": "4 × 10 inch",
    "application": "Plaster finishing; match blade condition",
    "rupees": 40,
    "source": "https://home-run.co/collections/general-hardware-tools",
    "image": "https://home-run.co/cdn/shop/files/Haks_Plaster_Trowel_Gurmala_4_x_10.png?v=1770112442&width=533"
  },
  {
    "slug": "jon-soft-mallet",
    "brand": "Jon Bhandari",
    "name": "Two-way soft-face mallet",
    "group": "tools",
    "pack": "1.4 inch face; 9.4 inch length",
    "application": "Gentle positioning of compatible components",
    "rupees": 180,
    "source": "https://home-run.co/collections/general-hardware-tools",
    "image": "https://home-run.co/cdn/shop/files/1_Jon_Bhandari_Two-Way_Soft-Face_Mallet_front.webp?v=1780308987&width=533"
  },
  {
    "slug": "taparia-long-nose",
    "brand": "Taparia",
    "name": "Econ-series long nose plier",
    "group": "tools",
    "pack": "165 mm / 6 inch",
    "application": "Grip and bend small parts; isolate electrical circuits",
    "rupees": 279,
    "source": "https://home-run.co/collections/general-hardware-tools",
    "image": "https://home-run.co/cdn/shop/files/1_654192d7-d8e7-4c80-ab7c-280f983dbb9e.webp?v=1786086856&width=533"
  },
  {
    "slug": "taparia-side-cutter",
    "brand": "Taparia",
    "name": "Side cutting plier",
    "group": "tools",
    "pack": "165 mm / 6 inch",
    "application": "Cut compatible wire; do not assume live electrical insulation",
    "rupees": 288,
    "source": "https://home-run.co/collections/general-hardware-tools",
    "image": "https://home-run.co/cdn/shop/files/61F6sgy9VvL._SL1500__1.webp?v=1785767100&width=533"
  },
  {
    "slug": "taparia-two-in-one",
    "brand": "Taparia",
    "name": "Two-in-one screwdriver",
    "group": "tools",
    "pack": "Black tip; confirm drive size",
    "application": "Manual fitting assembly",
    "rupees": 129,
    "source": "https://home-run.co/collections/general-hardware-tools",
    "image": "https://home-run.co/cdn/shop/files/12.webp?v=1785999531&width=533"
  },
  {
    "slug": "taparia-pipe-wrench",
    "brand": "Taparia",
    "name": "Pipe wrench",
    "group": "tools",
    "pack": "12 inch",
    "application": "Grip compatible pipe fittings; avoid damaging plastic fittings",
    "rupees": 459,
    "source": "https://home-run.co/collections/general-hardware-tools"
  },
  {
    "slug": "spirit-level",
    "brand": "Local supplier",
    "name": "Spirit level",
    "group": "tools",
    "pack": "Length and accuracy to confirm",
    "application": "Check horizontal and vertical alignment",
    "rupees": null,
    "source": null
  },
  {
    "slug": "supreme-floor-protection",
    "brand": "Supreme",
    "name": "Duraprotector-XF floor protection sheet",
    "group": "protection",
    "pack": "2 mm × 4.3 ft × 30 m roll",
    "application": "Protect finished floors during construction",
    "rupees": 3500,
    "source": "https://home-run.co/collections/general-hardware-tools",
    "image": "https://home-run.co/cdn/shop/files/IMG_20260518_131139_Supreme_Duraprotector-xf_Floor_Protection_Sheet.webp?v=1779259720&width=533"
  },
  {
    "slug": "fiberglass-mesh",
    "brand": "Local supplier",
    "name": "Alkali-resistant plaster reinforcement mesh",
    "group": "protection",
    "pack": "Mesh opening, weight and roll dimensions",
    "application": "Compatible plaster reinforcement; confirm system design",
    "rupees": null,
    "source": null
  },
  {
    "slug": "corner-bead",
    "brand": "Local supplier",
    "name": "Plaster corner bead",
    "group": "protection",
    "pack": "Material, length and profile",
    "application": "Protect and align plaster edges",
    "rupees": null,
    "source": null
  },
  {
    "slug": "masking-tape",
    "brand": "Local supplier",
    "name": "Painter masking tape",
    "group": "protection",
    "pack": "Width, roll length and substrate",
    "application": "Protect edges; remove within specified dwell time",
    "rupees": null,
    "source": null
  }
];
const existing:[string,HardwareGroup,number?,string?][]=[["jsw-aac-block-adhesive-block-grip-40-kg-bag-1","adhesives"],["hettich-slide-on-3447-non-silent-hinge-regular-close","furniture"],["hettich-0-crank-soft-close-hinges-25mm-9281432","furniture"],["ebco-slip-on-hinge-euro-regular-close-hinges-1-set-2-nos","furniture"],["myk-laticrete-dwa-215-tile-adhesive-10-kg","adhesives",1880,"10 kg pack"],["myk-laticrete-305-tile-adhesive-30kg","adhesives",420,"30 kg bag"],["tile-adhesive-c2","adhesives"],["door-hinge-stainless-steel","doors"]];
export function hardwareGroup(slug:string){return hardwareReferences.find(r=>r.slug===slug)?.group??existing.find(r=>r[0]===slug)?.[1];}
export function hardwareReference(slug:string){return hardwareReferences.find(r=>r.slug===slug);}
export function hardwarePrice(slug:string){const r=hardwareReference(slug);if(r?.rupees&&r.source)return {rupees:r.rupees,pack:r.priceVariant?r.pack+" · "+r.priceVariant:r.pack,source:r.source,checked:"Accessed 24 Nov 2026"};const old=existing.find(r=>r[0]===slug);return old?.[2]?{rupees:old[2],pack:old[3]??"Listed pack",source:"https://home-run.co/collections/tiling",checked:"Accessed 24 Nov 2026"}:null;}
