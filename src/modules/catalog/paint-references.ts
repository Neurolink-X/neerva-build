// Manufacturer catalogue references checked 24 Nov 2026; no dealer stock or selling price claim.
export type PaintGroup="interior"|"exterior"|"primer"|"putty"|"roof"|"bathroom"|"repair"|"admixture";
export type PaintReference={slug:string;brand?:string;name?:string;group:PaintGroup;tier:string;finish:string;source:string;mrp:number|null;image?:string};
export const paintReferences:PaintReference[]=[
  {
    "slug": "asian-paints-royale-shyne",
    "brand": "Asian Paints",
    "name": "Royale Shyne Luxury Emulsion",
    "group": "interior",
    "tier": "Luxury",
    "finish": "High sheen",
    "source": "https://www.asianpaints.com/paint-products/interior-wall-paints/plain-finishes.html",
    "mrp": 829,
    "image": "https://static.asianpaints.com/content/dam/asian_paints/products/packshots/interior-walls-royale-shyne-luxury-emulsion-asian-paints.png.transform/cc-width-230-height-273/image.png"
  },
  {
    "slug": "asian-paints-royale-matt",
    "brand": "Asian Paints",
    "name": "Royale Matt",
    "group": "interior",
    "tier": "Luxury",
    "finish": "Matt",
    "source": "https://www.asianpaints.com/paint-products/interior-wall-paints/plain-finishes.html",
    "mrp": 837,
    "image": "https://static.asianpaints.com/content/dam/asian_paints/products/packshots/interior-walls-royale-matt-asian-paints.png.transform/cc-width-230-height-273/image.png"
  },
  {
    "slug": "asian-paints-royale-luxury",
    "brand": "Asian Paints",
    "name": "Royale Luxury Emulsion",
    "group": "interior",
    "tier": "Luxury",
    "finish": "Soft sheen",
    "source": "https://www.asianpaints.com/paint-products/interior-wall-paints/plain-finishes/royale-luxury-emulsion.html",
    "mrp": 761
  },
  {
    "slug": "asian-paints-apcolite-premium",
    "brand": "Asian Paints",
    "name": "Apcolite Premium Emulsion",
    "group": "interior",
    "tier": "Premium",
    "finish": "Confirm finish and shade",
    "source": "https://www.asianpaints.com/paint-products/interior-wall-paints/plain-finishes.html",
    "mrp": 438
  },
  {
    "slug": "asian-paints-tractor-advanced",
    "brand": "Asian Paints",
    "name": "Tractor Emulsion Advanced",
    "group": "interior",
    "tier": "Economy",
    "finish": "Confirm finish and shade",
    "source": "https://www.asianpaints.com/paint-products/interior-wall-paints/plain-finishes.html",
    "mrp": 212
  },
  {
    "slug": "asian-paints-neobharat-latex",
    "brand": "Asian Paints",
    "name": "NeoBharat Latex Interior Paint",
    "group": "interior",
    "tier": "Economy",
    "finish": "Smooth finish",
    "source": "https://www.asianpaints.com/paint-products/interior-wall-paints/plain-finishes.html",
    "mrp": 98
  },
  {
    "slug": "asian-paints-apex-dust-proof-ultraa",
    "brand": "Asian Paints",
    "name": "Apex Dust Proof Ultraa",
    "group": "exterior",
    "tier": "Premium",
    "finish": "Exterior emulsion",
    "source": "https://www.asianpaints.com/paint-products/exterior-wall-paints/apex.html",
    "mrp": 430
  },
  {
    "slug": "asian-paints-damp-proof",
    "brand": "Asian Paints",
    "name": "SmartCare Damp Proof",
    "group": "roof",
    "tier": "System",
    "finish": "Liquid membrane",
    "source": "https://www.asianpaints.com/waterproofing-products/smartcare-damp-proof.html",
    "mrp": 392
  },
  {
    "slug": "asian-paints-damp-proof-xtreme",
    "brand": "Asian Paints",
    "name": "SmartCare Damp Proof Xtreme",
    "group": "roof",
    "tier": "System",
    "finish": "Roof coating",
    "source": "https://www.asianpaints.com/waterproofing-products/terrace-and-tanks.html",
    "mrp": 460
  },
  {
    "slug": "asian-paints-damp-sheath-interior",
    "brand": "Asian Paints",
    "name": "SmartCare Damp Sheath Interior Advanced",
    "group": "primer",
    "tier": "System",
    "finish": "Interior waterproofing primer",
    "source": "https://www.asianpaints.com/waterproofing-products/smartcare-damp-sheath-interior-advanced-primer.html",
    "mrp": 270
  },
  {
    "slug": "asian-paints-waterproof-putty",
    "brand": "Asian Paints",
    "name": "SmartCare Waterproofing Putty",
    "group": "putty",
    "tier": "System",
    "finish": "Cement-based putty",
    "source": "https://www.asianpaints.com/waterproofing-products/smartcare-waterproofing-putty.html",
    "mrp": null
  },
  {
    "slug": "asian-paints-damp-block-2k",
    "brand": "Asian Paints",
    "name": "SmartCare Damp Block 2K",
    "group": "bathroom",
    "tier": "System",
    "finish": "Two-component coating",
    "source": "https://www.asianpaints.com/waterproofing-products/all-products.html",
    "mrp": null
  },
  {
    "slug": "asian-paints-crack-seal",
    "brand": "Asian Paints",
    "name": "SmartCare Crack Seal",
    "group": "repair",
    "tier": "System",
    "finish": "Crack filler",
    "source": "https://www.asianpaints.com/waterproofing-products/all-products.html",
    "mrp": null
  },
  {
    "slug": "berger-easy-clean",
    "brand": "Berger",
    "name": "Easy Clean",
    "group": "interior",
    "tier": "Premium",
    "finish": "Rich sheen",
    "source": "https://www.bergerpaints.com/products/interior-wall-coatings/brand/easy-clean",
    "mrp": null,
    "image": "https://images.bergerpaints.com/s3fs-public/2023-08/Easy%20Clean%20can_0.png?format=webp&quality=75&width=640"
  },
  {
    "slug": "nerolac-beauty-gold-washable-plus",
    "brand": "Nerolac",
    "name": "Beauty Gold Washable Plus",
    "group": "interior",
    "tier": "Premium",
    "finish": "Rich sheen",
    "source": "https://www.nerolac.com/decorative-paint-products/interior-paints/beauty-gold-washable-plus",
    "mrp": null,
    "image": "https://www.nerolac.com/sites/default/files/2025-10/Beauty%20Gold%20Washable%20Plus.png"
  },
  {
    "slug": "nerolac-excel-total",
    "brand": "Nerolac",
    "name": "Excel Total",
    "group": "exterior",
    "tier": "Premium",
    "finish": "Exterior acrylic emulsion",
    "source": "https://www.nerolac.com/decorative-paint-products/exterior-paints/excel-total",
    "mrp": null
  },
  {
    "slug": "dr-fixit-lw-plus",
    "brand": "Dr. Fixit",
    "name": "Pidiproof LW+",
    "group": "admixture",
    "tier": "System",
    "finish": "Integral waterproofing additive",
    "source": "https://www.drfixit.co.in/home-owners/repair-renovate/roof-waterproofing/products",
    "mrp": null,
    "image": "https://drfixit-stg.s3.ap-south-1.amazonaws.com/assets/images/products/hdpi/16191739476082a23b4efc6.webp"
  },
  {
    "slug": "dr-fixit-pidifin-2k",
    "brand": "Dr. Fixit",
    "name": "Pidifin 2K",
    "group": "bathroom",
    "tier": "System",
    "finish": "Two-component waterproof coating",
    "source": "https://www.drfixit.co.in/home-owners/repair-renovate/roof-waterproofing/products",
    "mrp": null,
    "image": "https://drfixit-stg.s3.ap-south-1.amazonaws.com/assets/images/products/hdpi/1715087528663a28a81cb0b.webp"
  },
  {
    "slug": "dr-fixit-roofseal-ultra",
    "brand": "Dr. Fixit",
    "name": "Roofseal Ultra",
    "group": "roof",
    "tier": "System",
    "finish": "PU hybrid membrane",
    "source": "https://www.drfixit.co.in/home-owners/repair-renovate/roof-waterproofing/products",
    "mrp": null,
    "image": "https://drfixit-stg.s3.ap-south-1.amazonaws.com/assets/images/products/hdpi/17370904466789e58e64e3b.webp"
  },
  {
    "slug": "dr-fixit-pidicrete-urp",
    "brand": "Dr. Fixit",
    "name": "Pidicrete URP",
    "group": "repair",
    "tier": "System",
    "finish": "Repair bonding polymer",
    "source": "https://www.drfixit.co.in/home-owners/repair-renovate/roof-waterproofing/products",
    "mrp": null,
    "image": "https://drfixit-stg.s3.ap-south-1.amazonaws.com/assets/images/products/hdpi/16191739266082a22686c0b.webp"
  },
  {
    "slug": "jk-cement-wallmaxx-putty",
    "brand": "JK Cement",
    "name": "WallMaxX Wall Putty",
    "group": "putty",
    "tier": "System",
    "finish": "White cement-based wall putty",
    "source": "https://www.jkcement.com/wallmaxx-putty/",
    "mrp": null
  }
];
const existing:PaintReference[]=[
  {
    "slug": "asian-paints-tractor-emulsion",
    "group": "interior",
    "tier": "Economy",
    "finish": "Interior emulsion",
    "source": "https://www.asianpaints.com/paint-products/interior-wall-paints/plain-finishes.html",
    "mrp": 209
  },
  {
    "slug": "asian-paints-ace-base-white",
    "group": "exterior",
    "tier": "Economy",
    "finish": "Exterior emulsion",
    "source": "https://www.asianpaints.com/paint-products/exterior-wall-paints/ace.html",
    "mrp": 252
  },
  {
    "slug": "asian-paints-apex-base-white",
    "group": "exterior",
    "tier": "Premium",
    "finish": "Exterior emulsion",
    "source": "https://www.asianpaints.com/paint-products/exterior-wall-paints/apex.html",
    "mrp": null
  },
  {
    "slug": "emulsion-interior-brand-quote",
    "group": "interior",
    "tier": "Confirm with dealer",
    "finish": "Choose finish",
    "source": "",
    "mrp": null
  },
  {
    "slug": "exterior-waterproofing-system",
    "group": "roof",
    "tier": "System",
    "finish": "Site-specific system",
    "source": "",
    "mrp": null
  }
];
export const paintGroups:Record<PaintGroup,string>={interior:"Interior walls",exterior:"Exterior walls",primer:"Primer / damp walls",putty:"Wall putty",roof:"Roof / terrace",bathroom:"Bathroom / wet areas",repair:"Crack and repair",admixture:"Concrete admixture"};
export function paintReference(slug:string){return [...paintReferences,...existing].find(r=>r.slug===slug);}
export function paintReferencePrice(slug:string){const r=paintReference(slug);return r?.mrp&&r.source?{rupees:r.mrp,source:r.source,checked:"24 Nov 2026"}:null;}
export function paintLitres(area:number,coverage:number,waste:number){if(!Number.isFinite(area)||!Number.isFinite(coverage)||!Number.isFinite(waste)||area<=0||area>100000||coverage<=0||coverage>1000||waste<0||waste>25)return null;return Math.ceil(area/coverage*(1+waste/100)*100)/100;}
