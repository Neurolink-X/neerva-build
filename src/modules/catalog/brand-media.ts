/**
 * Real manufacturer marks / photographs from traceable published sources.
 * Public editorial brand identification only; not a product SKU verification,
 * a dealer authorization, partnership or the selected variant's packaging.
 * No synthetic packaging, fabricated logo marks, or Google Images scraping.
 *
 * Trademarks remain the property of their owners. Display only to identify
 * reference brands, without endorsement claims.
 */
export const brandMedia={
 "ACC":{
  logo:"https://upload.wikimedia.org/wikipedia/commons/f/fe/ACC_Limited_logo.svg",
  logoSource:"https://commons.wikimedia.org/wiki/File:ACC_Limited_logo.svg",
  logoAttribution:"ACC Limited · PD-textlogo (trademark applies)",
  officialProductPage:"https://www.acclimited.com/annual-report-2025-26/product-portfolio.html"
 },
 "UltraTech":{
  logo:"https://upload.wikimedia.org/wikipedia/commons/1/18/UltraTech_logo.jpg",
  logoSource:"https://commons.wikimedia.org/wiki/File:UltraTech_logo.jpg",
  logoAttribution:"UltraTech · PD-textlogo (trademark applies)",
  officialProductPage:"https://www.ultratechcement.com/corporate/media/press-kit",
  pressPhoto:"https://www.ultratechcement.com/content/dam/ultratechcementwebsite/media/ultratech_indi-27sno-1cement_hiresr1.jpg",
  pressPhotoSource:"https://www.ultratechcement.com/corporate/media/press-kit",
  pressPhotoLabel:"Official manufacturer media-kit cement bag image; exact grade and stock not confirmed"
 },
 "UltraTech Cement":{
  logo:"https://upload.wikimedia.org/wikipedia/commons/1/18/UltraTech_logo.jpg",
  logoSource:"https://commons.wikimedia.org/wiki/File:UltraTech_logo.jpg",
  logoAttribution:"UltraTech · PD-textlogo (trademark applies)",
  officialProductPage:"https://www.ultratechcement.com/corporate/media/press-kit",
  pressPhoto:"https://www.ultratechcement.com/content/dam/ultratechcementwebsite/media/ultratech_indi-27sno-1cement_hiresr1.jpg",
  pressPhotoSource:"https://www.ultratechcement.com/corporate/media/press-kit",
  pressPhotoLabel:"Manufacturer media-kit cement-bag photograph; exact grade and stock not confirmed"
 }
} as const;
export type BrandMedia=typeof brandMedia[keyof typeof brandMedia];
export function brandMediaFor(name:string):BrandMedia|null{
 const key=name.trim();
 for(const [candidate,media] of Object.entries(brandMedia)){
  if(candidate.toLowerCase()===key.toLowerCase())return media;
 }
 return null;
}
