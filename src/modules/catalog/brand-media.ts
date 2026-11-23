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
  logo:"/images/catalog/reference/acc_limited_logo.webp",
  logoSource:"https://commons.wikimedia.org/wiki/File:ACC_Limited_logo.svg",
  logoAttribution:"ACC Limited · PD-textlogo (trademark applies)",
  officialProductPage:"https://www.acclimited.com/annual-report-2025-26/product-portfolio.html"
 },
 "UltraTech":{
  logo:"/images/catalog/reference/ultratech-logo.webp",
  logoSource:"https://commons.wikimedia.org/wiki/File:UltraTech_logo.jpg",
  logoAttribution:"UltraTech · PD-textlogo (trademark applies)",
  officialProductPage:"https://www.ultratechcement.com/corporate/media/press-kit",
  pressPhoto:"/images/catalog/reference/ultratech-indi-27sno-1cement-hiresr1.webp",
  pressPhotoSource:"https://www.ultratechcement.com/corporate/media/press-kit",
  pressPhotoLabel:"Official manufacturer media-kit cement bag image; exact grade and stock not confirmed"
 },
 "JSW Neosteel":{
  logo:"/images/catalog/reference/jsw_group_logo.webp",
  logoSource:"https://commons.wikimedia.org/wiki/File:JSW_Group_logo.svg",
  logoAttribution:"JSW Group corporate text-logo · PD-textlogo, trademark remains with JSW; not an exact Neosteel product logo",
  officialProductPage:"https://www.jswneosteel.in/"
 },
 "Asian Paints":{
  logo:"/images/catalog/reference/asian_paints_logo.webp",
  logoSource:"https://commons.wikimedia.org/wiki/File:Asian_Paints_Logo.svg",
  logoAttribution:"Asian Paints corporate mark · Wikimedia PD-textlogo, trademark applies; verify current branding with manufacturer",
  officialProductPage:"https://www.asianpaints.com/"
 },
 "UltraTech Cement":{
  logo:"/images/catalog/reference/ultratech-logo.webp",
  logoSource:"https://commons.wikimedia.org/wiki/File:UltraTech_logo.jpg",
  logoAttribution:"UltraTech · PD-textlogo (trademark applies)",
  officialProductPage:"https://www.ultratechcement.com/corporate/media/press-kit",
  pressPhoto:"/images/catalog/reference/ultratech-indi-27sno-1cement-hiresr1.webp",
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
