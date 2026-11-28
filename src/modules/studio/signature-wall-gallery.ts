import type {Pattern} from "./wall-patterns.ts";
/** Small editorial selection with fixed, intentional palettes. Not a second
 * editable paint catalogue and not a claim of a physically installed finish. */
export const signatureWallGallery=[
 {id:"emerald-geometry",pattern:"facets",name:"Emerald & champagne",style:"Architectural geometry",base:"#173a30",accent:"#c5a15c",room:"Living room"},
 {id:"midnight-floral",pattern:"eclipse",name:"Midnight botanical",style:"Metallic floral mural",base:"#14243a",accent:"#d4ad62",room:"Dining room"},
 {id:"silk-arch",pattern:"arch",name:"Silk arch composition",style:"Modern sculptural paint",base:"#344c45",accent:"#d8b58a",room:"Bedroom"},
 {id:"woodland-fresco",pattern:"botanical",name:"Verdant fresco",style:"Botanical artwork",base:"#e3d8bd",accent:"#3c624b",room:"Living room"},
 {id:"champagne-flow",pattern:"modernRibbons",name:"Champagne flow",style:"Brush and metallic ribbons",base:"#534033",accent:"#d9b77d",room:"Reception"},
 {id:"ocean-silk",pattern:"sculptWave",name:"Ocean silk",style:"Tonal dimensional illusion",base:"#d5dbe0",accent:"#49697b",room:"Bedroom"},
 {id:"lotus-stillness",pattern:"lotusPond",name:"Lotus stillness",style:"Landscape mural",base:"#e2d5c3",accent:"#526b65",room:"Reading room"},
 {id:"midnight-orbit",pattern:"orbit",name:"Midnight orbit",style:"Focal metallic artwork",base:"#172b30",accent:"#d6b97c",room:"Living room"}
] as const satisfies readonly {id:string;pattern:Pattern;name:string;style:string;base:string;accent:string;room:string}[];
