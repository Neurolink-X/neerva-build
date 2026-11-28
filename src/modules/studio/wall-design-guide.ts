import type {Pattern,PatternGroup} from "./wall-patterns.ts";
/** One recommendation per collection; no second catalogue or duplicated design IDs. */
export const collectionGuide={
 Signature:{title:"Signature murals",description:"Large-scale focal compositions for a living room, bedroom or reception.",tip:"Leave breathing space around the artwork; avoid repeating it across every wall."},
 Murals:{title:"Nature murals",description:"Birds, a tree silhouette, a river landscape and wildflowers for a single feature wall.",tip:"Use a subtle accent on a broad wall. Transfer the design with a stencil or grid and test on a sample board."},
 Nature:{title:"Nature-inspired",description:"Botanical stencils and gentle landscapes for calm rooms.",tip:"Muted greens, warm ivory and earthy tones work well; keep the other walls quiet."},
 Classic:{title:"Classic luxury",description:"Refined linework and architectural detail for dining and formal spaces.",tip:"Use a restrained accent colour and review the stencil scale on a sample board."},
 Modern:{title:"Modern decorative",description:"Curved accents, colour blocking and contemporary panel compositions.",tip:"Align the feature with furniture and door edges before marking the wall."},
 Geometry:{title:"Geometric wall designs",description:"Angular colour blocks, chevrons, framed panels, fine lines and grids for contemporary interiors and accents.",tip:"Use a restrained palette and align the design with the wall edges. Choose one feature surface before repeating the pattern."},
 Textures:{title:"Decorative textures",description:"Soft tonal variation for understated wall finishes.",tip:"Check a physical sample in daylight; the preview cannot reproduce tactile texture."},
 Artisan:{title:"Artisan finishes",description:"Plaster and stone-inspired decorative wall effects.",tip:"Specialist finishes may need preparation or skilled application; confirm with your painter."},
 Architectural:{title:"Luxury architectural",description:"Painted effects inspired by mouldings, fluted walls and reception details.",tip:"This is a painted visual concept, not a simulation of physical grooves or installed panels."}
} as const satisfies Record<PatternGroup,{title:string;description:string;tip:string}>;
export const featureWallPatterns=["sunDisc","orbit","eclipse","layeredArches","abstractLeaves","floralScroll","bamboo","forest","mountain","flyingBirds","gardenTree","riverSunset","meadowBloom"] as const satisfies readonly Pattern[];
export function isFeatureWall(p:Pattern){return (featureWallPatterns as readonly Pattern[]).includes(p);}
