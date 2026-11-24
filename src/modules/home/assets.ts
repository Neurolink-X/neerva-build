/**
 * Licensed editorial reference photographs, not NEERVA projects, exact model renders,
 * or a before/after record of the same building.
 * Unsplash License: https://unsplash.com/license
 * Avoid trademark/endorsement claims and never use these as exact branded SKUs.
 * Remote URLs are pinned to photo IDs (no random source.unsplash.com requests).
 */
import {PUBLIC_CATEGORY_IMAGES} from "@/modules/catalog/public-products";
const photo=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=79`;
export const homeReferencePhotos=[
 // Unsplash photo-1600585154340-be6161a56a0c
 {src:"/images/studio/house-1.webp",name:"Contemporary house exterior · photographic inspiration",type:"residence"},
 // Unsplash photo-1600596542815-ffad4c1539a9
 {src:"/images/studio/house-2.webp",name:"Premium modern residence · photographic inspiration",type:"residence"},
 // Unsplash photo-1600047509807-ba8f99d2cdde
 {src:"/images/studio/house-3.webp",name:"Residential villa exterior · photographic inspiration",type:"residence"},
 // Unsplash photo-1600585152915-d208bec867a1
 {src:"/images/studio/house-4.webp",name:"Open-plan living room with garden access",type:"residence"},
 // Unsplash photo-1600573472591-ee6b68d14c68
 {src:"/images/studio/house-5.webp",name:"Bright living room with glazed doors",type:"residence"},
 // Unsplash photo-1600585152220-90363fe7e115
 {src:"/images/studio/house-6.webp",name:"Kitchen with breakfast island",type:"residence"}
] as const;
export const homeVisuals={
 hero:homeReferencePhotos[0].src,
 construction:photo("photo-1504307651254-35680f356dfd"),
 warm:homeReferencePhotos[1].src,
 slate:homeReferencePhotos[2].src,
 nature:homeReferencePhotos[4].src,
 interior:photo("photo-1600607687920-4e2a09cf159d"),
 steel:PUBLIC_CATEGORY_IMAGES.steel,
 cement:PUBLIC_CATEGORY_IMAGES.cement,
 bricks:PUBLIC_CATEGORY_IMAGES["bricks-blocks"],
 pipes:PUBLIC_CATEGORY_IMAGES.plumbing,
 electrical:PUBLIC_CATEGORY_IMAGES.electrical,
 aggregates:PUBLIC_CATEGORY_IMAGES.aggregates,
 paint:PUBLIC_CATEGORY_IMAGES.paint,
 tiles:PUBLIC_CATEGORY_IMAGES.tiles,
 hardware:PUBLIC_CATEGORY_IMAGES.hardware
} as const;
