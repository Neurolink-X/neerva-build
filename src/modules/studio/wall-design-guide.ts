import {isPracticalPaintArt} from "./practical-paint-art.ts";
import {isPremiumRaster} from "./premium-wall-raster.ts";
import type {Pattern,PatternGroup} from "./wall-patterns.ts";
/** One recommendation per collection; no second catalogue or duplicated design IDs. */
export const collectionGuide={
 Signature:{title:"Signature murals",description:"Hand-painted floral murals, metallic accents and brush textures; Orbit Rings remains a focal accent.",tip:"Leave breathing space around the artwork; avoid repeating it across every wall."},
 Murals:{title:"Nature murals",description:"Artist-inspired ink washes, botanical brushwork, painted architectural compositions and detailed nature frescoes.",tip:"Use a subtle accent on a broad wall. Transfer the design with a stencil or grid and test on a sample board."},
 Nature:{title:"Nature-inspired",description:"Full-wall botanical frescoes and layered landscapes, with original blossom artwork.",tip:"Muted greens, warm ivory and earthy tones work well; keep the other walls quiet."},
 Classic:{title:"Classic luxury",description:"Refined linework and architectural detail for dining and formal spaces.",tip:"Use a restrained accent colour and review the stencil scale on a sample board."},
 Modern:{title:"Modern decorative",description:"Paintable arches, colour blocking, brush effects and decorative borders.",tip:"Align the feature with furniture and door edges before marking the wall."},
 Geometry:{title:"Geometric wall designs",description:"Artisan interlocking inlay, painted frames and fine isometric wirework. No tile joints.",tip:"Use a restrained palette and align the design with the wall edges. Choose one feature surface before repeating the pattern."},
 Printed:{title:"Decorative stencils",description:"Botanical and heritage designs transferable by stencil or hand-painted brushwork.",tip:"Confirm stencil scale with your painter and test on a sample board."},
 "3D effects":{title:"Sculptural light & relief",description:"Directional painted highlights, recessed shadows and sculptural rhythms simulate dimensional surfaces.",tip:"These are painted optical illusions, not physical relief or actual 3D panels."},
 Architectural:{title:"Architectural atelier",description:"Painted moulding-style borders and architectural linework; no physical panels required.",tip:"This is a painted visual concept, not a simulation of physical grooves or installed panels."}
} as const satisfies Record<PatternGroup,{title:string;description:string;tip:string}>;
export const featureWallPatterns=["sunDisc","orbit","eclipse","layeredArches","abstractLeaves","floralScroll","bamboo","forest","mountain","flyingBirds","gardenTree","riverSunset","meadowBloom","aurora","galleryArc","celestial","lotusPond","desertDunes","oceanCliffs","citySilhouette","fernStencil","blossomBranch","modernRibbons","offsetCircles","asymmetric","mural","artDecoSunburst","galleryArc","celestial"] as const satisfies readonly Pattern[];
const fullWall=new Set<Pattern>(["riverSunset","lotusPond","forest","aurora","gardenTree","bamboo","waterflow","desertDunes","oceanCliffs","citySilhouette","mountain","meadowBloom"]);
export function isFeatureWall(p:Pattern){return !isPracticalPaintArt(p)&&!isPremiumRaster(p)&&!fullWall.has(p)&&(featureWallPatterns as readonly Pattern[]).includes(p);}
