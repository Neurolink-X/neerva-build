import type {Pattern} from "./wall-patterns.ts";
import {detailedWallRecipe} from "./detailed-wall-recipes.ts";
import {isFeatureWall} from "./wall-design-guide.ts";
type Method="Masking-tape paint"|"Stencil paint"|"Hand-painted mural"|"Decorative texture paint"|"Metallic accent paint"|"Tonal paint illusion";
export type PaintExecution={method:Method;difficulty:"Easy"|"Moderate"|"Specialist";finish:string;maintenance:string;coverage:string;execution:string};
const groups:Record<Method,readonly Pattern[]>={
 "Masking-tape paint":["arch","split","asymmetric","scallop","steppedColourBlock","offsetCircles","facets","grid","diagonal","panels","herringbone","hexGrid","angularWeave","diamonds","inset","layeredArches","atelierPanel","regencyPanel","palazzoPanel","artHotelPanel","contemporaryPanel","grandSalon","archGallery"],
 "Stencil paint":["floralScroll","bamboo","fernStencil","heritage","decoFan","royalRosette","jaliMedallion","ogee","silkBotanical","imperialVine","indigoMedallion","magnoliaRepeat","moroccanFiligree","palaceFloral","japaneseKamon"],
 "Hand-painted mural":["botanical","forest","mountain","waterflow","blossomBranch","flyingBirds","gardenTree","riverSunset","meadowBloom","lotusPond","desertDunes","oceanCliffs","citySilhouette","abstractLeaves","celestial"],
 "Decorative texture paint":["sunDisc","aurora","mural","modernRibbons","bands","walnutPanel"],
 "Metallic accent paint":["orbit","eclipse","galleryArc","artDecoSunburst","decoInlay"],
 "Tonal paint illusion":["sculptFlute","sculptWave","sculptDiamond","sculptFold","sculptReed","sculptRibbon","sculptStone","sculptPrism"]
};
export function paintExecution(key:Pattern):PaintExecution|undefined{
 const method=(Object.keys(groups) as Method[]).find(m=>groups[m].includes(key));
 if(!method)return;
 const details:Record<Method,Pick<PaintExecution,"difficulty"|"finish"|"execution">>={
 "Masking-tape paint":{difficulty:"Moderate",finish:"Matte or satin emulsion",execution:"Mark the layout with a level and low-tack tape; apply thin coats and remove tape as directed."},
 "Stencil paint":{difficulty:"Moderate",finish:"Matte or satin emulsion",execution:"Use a reusable stencil, low paint load and a test board to prevent bleeding."},
 "Hand-painted mural":{difficulty:"Specialist",finish:"Artist acrylic or compatible interior emulsion",execution:"Transfer the artwork using a grid, then paint in layers with a mural artist."},
 "Decorative texture paint":{difficulty:"Moderate",finish:"Compatible decorative glaze or texture coating",execution:"Ask a trained painter for a sample of the brush or sponge technique."},
 "Metallic accent paint":{difficulty:"Specialist",finish:"Metallic decorative paint on matte base",execution:"Use compatible metallic paint for highlights and check appearance under room lighting."},
 "Tonal paint illusion":{difficulty:"Specialist",finish:"Matte or satin tonal paint",execution:"Use gradients and painted highlights; physical relief requires separate specialist work."}
 };
 return {method,...details[method],maintenance:"Dust gently; clean only as permitted by the paint manufacturer.",coverage:isFeatureWall(key)?"Focal accent":"Full selected wall",execution:details[method].execution+(detailedWallRecipe(key)?" Test the final colours on the wall before approval.":"")};
}
