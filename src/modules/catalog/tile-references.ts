// Published manufacturer references, reviewed 2026-11-24. Not a dealer offer or live stock.
export type TileReference={slug:string;handle:string;name:string;size:string;material:string;finish:string;design:string;use:string;mrp:number;box?:number;coverage?:number;swatch?:string;room?:string};
export const tileReferences:TileReference[]=[
  {
    "slug": "orientbell-calacatta-marble",
    "handle": "super-gloss-endless-calacatta-marble",
    "name": "Super Gloss Endless Calacatta Marble",
    "size": "600 × 1200 mm",
    "material": "Glazed vitrified",
    "finish": "Super glossy",
    "design": "Marble",
    "use": "Living room, bedroom, accent wall",
    "mrp": 162,
    "swatch": "https://images.orientbell.com/media/catalog/product/s/u/super_gloss_endless_calacatta_marble_f1.jpg",
    "room": "https://images.orientbell.com/media/catalog/product/s/u/super_gloss_endless_calacatta_marble_1.jpg"
  },
  {
    "slug": "orientbell-lumber-oak",
    "handle": "dr-dgvt-lumber-oak-wood",
    "name": "DR DGVT Lumber Oak Wood",
    "size": "200 × 1200 mm",
    "material": "Glazed vitrified",
    "finish": "Matte",
    "design": "Wood",
    "use": "Living room, bedroom",
    "mrp": 149,
    "swatch": "https://images.orientbell.com/media/catalog/product/d/r/dr_dgvt_lumber_oak_wood_f1.jpg"
  },
  {
    "slug": "orientbell-safegrip-creama",
    "handle": "dgvt-safegrip-rustic-creama",
    "name": "DGVT SafeGrip Rustic Creama",
    "size": "600 × 600 mm",
    "material": "Glazed vitrified",
    "finish": "Matte",
    "design": "Cement texture",
    "use": "Bathroom, kitchen, balcony; confirm wet-area slip rating",
    "mrp": 107,
    "box": 4,
    "coverage": 1.44,
    "swatch": "https://images.orientbell.com/media/catalog/product/d/g/dgvt_safegrip_rustic_creama_f1.jpg",
    "room": "https://images.orientbell.com/media/catalog/product/d/g/dgvt_safegrip_rustic_creama.jpg"
  },
  {
    "slug": "orientbell-grace-wood",
    "handle": "hfm-anti-skid-ec-grace-wood-brown",
    "name": "HFM Anti-Skid EC Grace Wood Brown",
    "size": "300 × 300 mm",
    "material": "Ceramic",
    "finish": "Matte",
    "design": "Wood texture",
    "use": "Bathroom, balcony, terrace; confirm wet-area slip rating",
    "mrp": 64,
    "box": 10,
    "coverage": 0.9,
    "swatch": "https://images.orientbell.com/media/catalog/product/h/f/hfm_anti-skid_ec_grace_wood_brown__ceramic_tile_floor_tile_300x300_mm.jpg"
  },
  {
    "slug": "orientbell-sandy-cube",
    "handle": "shg-sandy-cube-hl",
    "name": "SHG Sandy Cube HL",
    "size": "300 × 450 mm",
    "material": "Ceramic",
    "finish": "Glossy",
    "design": "Geometric",
    "use": "Kitchen wall, backsplash",
    "mrp": 63,
    "box": 6,
    "coverage": 0.81
  },
  {
    "slug": "orientbell-orobico-marble",
    "handle": "super-gloss-orobico-marble",
    "name": "Super Gloss Orobico Marble",
    "size": "600 × 1200 mm",
    "material": "Glazed vitrified",
    "finish": "Super glossy",
    "design": "Marble",
    "use": "Living room, bedroom, accent wall",
    "mrp": 154
  },
  {
    "slug": "orientbell-venezia-wood",
    "handle": "anti-skid-ec-venezia-wood-dk",
    "name": "Anti-Skid EC Venezia Wood DK",
    "size": "300 × 300 mm",
    "material": "Ceramic",
    "finish": "Matte",
    "design": "Wood texture",
    "use": "Bathroom, balcony, terrace; confirm wet-area slip rating",
    "mrp": 71,
    "box": 10,
    "coverage": 0.9
  }
];
const rates=[...tileReferences,...[{"slug":"orientbell-star","handle":"dgvt-nexa-star-white-025606663250565361m","mrp":95},{"slug":"orientbell-opal","handle":"ft-opal-crema-024606654091098361m","mrp":85},{"slug":"orientbell-oak","handle":"dr-dgvt-lugano-oak-wood-ivory","mrp":149}]];
export function tileReferencePrice(slug:string){const row=rates.find(x=>x.slug===slug);return row?{rupees:row.mrp,source:"https://www.orientbell.com/"+row.handle,checked:"24 Nov 2026"}:null;}
export function tileReferenceMedia(slug:string){return tileReferences.find(x=>x.slug===slug);}
