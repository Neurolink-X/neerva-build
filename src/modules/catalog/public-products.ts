/** Original, production-verified public images; illustrations are not proof of verified stock. */
export const PUBLIC_CATEGORY_IMAGES={
  steel:"/images/catalog/tmt-bars.webp",
  cement:"/images/catalog/cement-sack.webp",
  "bricks-blocks":"/images/catalog/clay-bricks.webp",
  plumbing:"/images/catalog/pvc-pipe.webp",
  electrical:"/images/catalog/electrical-wiring.webp",
  aggregates:"/images/catalog/aggregates-samples.webp",
} as const;
export function categoryImage(category:string):string|null{
  return Object.prototype.hasOwnProperty.call(PUBLIC_CATEGORY_IMAGES,category)
    ? PUBLIC_CATEGORY_IMAGES[category as keyof typeof PUBLIC_CATEGORY_IMAGES]:null;
}
