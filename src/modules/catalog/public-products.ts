/** Public media includes representative licensed photographs, not exact manufacturer SKU photo proof. \n * Paint/tiles/hardware: Pexels Free License, photo IDs 6764238, 40080972, 4049352. \n * See docs/pr26-photography-and-sku-provenance-20261123.md. */
export const PUBLIC_CATEGORY_IMAGES={
  steel:"/images/catalog/tmt-bars.webp",
  cement:"/images/catalog/cement-sack.webp",
  "bricks-blocks":"/images/catalog/clay-bricks.webp",
  plumbing:"/images/catalog/pvc-pipe.webp",
  electrical:"/images/catalog/electrical-wiring.webp",
  aggregates:"/images/catalog/aggregates-samples.webp",
  paint:"https://images.pexels.com/photos/6764238/pexels-photo-6764238.jpeg?auto=compress&cs=tinysrgb&w=900",
  tiles:"https://images.pexels.com/photos/40080972/pexels-photo-40080972.jpeg?auto=compress&cs=tinysrgb&w=900",
  hardware:"https://images.pexels.com/photos/4049352/pexels-photo-4049352.jpeg?auto=compress&cs=tinysrgb&w=900",
} as const;
export function categoryImage(category:string):string|null{
  return Object.prototype.hasOwnProperty.call(PUBLIC_CATEGORY_IMAGES,category)
    ? PUBLIC_CATEGORY_IMAGES[category as keyof typeof PUBLIC_CATEGORY_IMAGES]:null;
}
