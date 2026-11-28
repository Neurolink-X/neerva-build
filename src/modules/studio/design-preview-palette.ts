import type {Pattern} from "./wall-patterns.ts";
/** Each composition is readable independently of the user's currently painted wall. */
const palettes:Partial<Record<Pattern,readonly [string,string]>>={
 facets:["#f0e4d3","#243a56"],grid:["#e9dfcf","#9b6739"],diagonal:["#182b45","#d9ae61"],panels:["#e7e4df","#45556a"],bands:["#f0e5d4","#aa6748"],herringbone:["#e9e7df","#344d57"],hexGrid:["#142d42","#d6aa63"],angularWeave:["#eee5d4","#536c80"],
 eclipse:["#14243a","#d7b265"],orbit:["#172a37","#d8bd82"],arch:["#e8dac8","#824a36"],modernRibbons:["#312c42","#e0b57f"],mural:["#e7d9cd","#5b748e"],split:["#f1dfc2","#a57a54"],asymmetric:["#d5d9dc","#344563"],scallop:["#ece2d5","#a86a4f"],steppedColourBlock:["#e9dfcf","#536a83"],offsetCircles:["#242e46","#d8ae65"],
 oceanCliffs:["#e6dfd2","#255b83"],desertDunes:["#f2e6d3","#a66436"],citySilhouette:["#243148","#e3bd7b"],riverSunset:["#e5d9c5","#66768b"],lotusPond:["#eee2d3","#83677c"],sculptWave:["#e4e4e3","#7e8b9c"],sculptFold:["#e7dbcb","#b58b53"],sculptRibbon:["#292f3a","#c9b7a6"],botanical:["#e8e2d2","#386454"],blossomBranch:["#e9dfd7","#a57177"]
};
const defaults=[["#e9e2d9","#5b657a"],["#eee1cd","#a77849"],["#dbe0e7","#3d526d"],["#e8dfe4","#805e76"]] as const;
export function designPreviewPalette(pattern:Pattern):readonly [string,string]{let hash=0;for(const c of pattern)hash=(hash*31+c.charCodeAt(0))>>>0;return palettes[pattern]??defaults[hash%defaults.length];}
