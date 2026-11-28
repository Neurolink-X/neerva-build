import type {Pattern,PatternGroup} from "./wall-patterns.ts";
/** One recommendation per collection; no second catalogue or duplicated design IDs. */
export const collectionGuide={
 Signature:{title:"Signature murals",description:"Large-scale focal compositions for a living room, bedroom or reception.",tip:"Leave breathing space around the artwork; avoid repeating it across every wall."},
 Murals:{title:"Nature murals",description:"Original birds, flowering branches, a river landscape and lotus pond.",tip:"Use a subtle accent on a broad wall. Transfer the design with a stencil or grid and test on a sample board."},
 Nature:{title:"Nature-inspired",description:"Botanical stencils and gentle landscapes for calm rooms.",tip:"Muted greens, warm ivory and earthy tones work well; keep the other walls quiet."},
 Classic:{title:"Classic luxury",description:"Refined linework and architectural detail for dining and formal spaces.",tip:"Use a restrained accent colour and review the stencil scale on a sample board."},
 Modern:{title:"Modern decorative",description:"Curved accents, colour blocking and contemporary panel compositions.",tip:"Align the feature with furniture and door edges before marking the wall."},
 Geometry:{title:"Geometric wall designs",description:"Bevelled honeycomb, large colour-block hexagons, chevron inlays and fine isometric cube linework.",tip:"Use a restrained palette and align the design with the wall edges. Choose one feature surface before repeating the pattern."},
 Printed:{title:"Designer prints & inlays",description:"Layered botanical, palace, textile and brass-inspired artwork for premium printed feature walls.",tip:"Confirm repeat scale and material with your installer."},
 "3D effects":{title:"Sculptural light & relief",description:"Directional painted highlights, recessed shadows and sculptural rhythms simulate dimensional surfaces.",tip:"These are painted optical illusions, not physical relief or actual 3D panels."},
 Architectural:{title:"Architectural atelier",description:"Layered Parisian, Regency, Palazzo and contemporary panel compositions with painted depth.",tip:"This is a painted visual concept, not a simulation of physical grooves or installed panels."}
} as const satisfies Record<PatternGroup,{title:string;description:string;tip:string}>;
export const featureWallPatterns=["sunDisc","orbit","eclipse","layeredArches","abstractLeaves","floralScroll","bamboo","forest","mountain","flyingBirds","gardenTree","riverSunset","meadowBloom","aurora","galleryArc","celestial","lotusPond","desertDunes","oceanCliffs","citySilhouette","fernStencil","blossomBranch","modernRibbons","offsetCircles","asymmetric","mural","artDecoSunburst","galleryArc","celestial"] as const satisfies readonly Pattern[];
const fullWall=new Set<Pattern>(["riverSunset","lotusPond","forest","aurora","gardenTree","bamboo","waterflow","desertDunes","oceanCliffs","citySilhouette","mountain","meadowBloom"]);
export function isFeatureWall(p:Pattern){return !fullWall.has(p)&&(featureWallPatterns as readonly Pattern[]).includes(p);}
