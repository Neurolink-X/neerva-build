/** Public media includes representative licensed photographs, not exact manufacturer SKU photo proof. \n * Paint/tiles/hardware: Pexels Free License, photo IDs 6764238, 40080972, 4049352. \n * See docs/pr26-photography-and-sku-provenance-20261123.md. */
export const PUBLIC_CATEGORY_IMAGES={
  steel:"/images/catalog/tmt-bars.webp",
  cement:"/images/catalog/reference/ultratech-ppc-cement.webp",
  "bricks-blocks":"/images/catalog/clay-bricks.webp",
  plumbing:"/images/catalog/editorial/pipe-stack.jpg",
  electrical:"/images/catalog/electrical-wiring.webp",
  aggregates:"/images/catalog/aggregates-samples.webp",
  paint:"/images/catalog/reference/pexels-photo-6764238.webp",
  tiles:"/images/catalog/reference/pexels-photo-40080972.webp",
  hardware:"/images/catalog/approved/dcfd048c44fdaf7bbbf6232c.webp",
} as const;
export function categoryImage(category:string):string|null{
  return Object.prototype.hasOwnProperty.call(PUBLIC_CATEGORY_IMAGES,category)
    ? PUBLIC_CATEGORY_IMAGES[category as keyof typeof PUBLIC_CATEGORY_IMAGES]:null;
}
