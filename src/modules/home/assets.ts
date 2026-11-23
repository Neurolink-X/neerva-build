/** Local material-category photography and matched illustrative construction artwork.
 * Images are never proof of manufacturer authorization or exact SKU inventory.
 */
import {PUBLIC_CATEGORY_IMAGES} from "@/modules/catalog/public-products";
export const homeVisuals={
 hero:"/illustrations/neerva-house-finished.svg",
 construction:"/illustrations/neerva-house-construction.svg",
 warm:"/illustrations/neerva-house-finished.svg",
 slate:"/illustrations/neerva-house-construction.svg",
 nature:"/illustrations/neerva-house-finished.svg",
 interior:"/illustrations/neerva-house-finished.svg",
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
