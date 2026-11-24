/** Public media includes representative licensed photographs, not exact manufacturer SKU photo proof. \n * Paint/tiles/hardware: Pexels Free License, photo IDs 6764238, 40080972, 4049352. \n * See docs/pr26-photography-and-sku-provenance-20261123.md. */
export const PUBLIC_CATEGORY_IMAGES={
  steel:"/images/catalog/tmt-bars.webp",
  cement:"/images/catalog/cement-sack.webp",
  "bricks-blocks":"/images/catalog/clay-bricks.webp",
  plumbing:"/images/catalog/reference/ashirvad-pipe.webp",
  electrical:"/images/catalog/electrical-wiring.webp",
  aggregates:"/images/catalog/aggregates-samples.webp",
  paint:"/images/catalog/reference/pexels-photo-6764238.webp",
  tiles:"/images/catalog/reference/orientbell-opal.webp",
  hardware:"/images/catalog/reference/pexels-photo-4049352.webp",
} as const;
export function categoryImage(category:string):string|null{
  return Object.prototype.hasOwnProperty.call(PUBLIC_CATEGORY_IMAGES,category)
    ? PUBLIC_CATEGORY_IMAGES[category as keyof typeof PUBLIC_CATEGORY_IMAGES]:null;
}
