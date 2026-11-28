import {isPremiumRaster,premiumRasterNames} from "./premium-wall-raster.ts";
import type {Pattern} from "./wall-patterns.ts";
import type {MaterialDetail} from "./material-detail.ts";
type Material="pigment"|"wash"|"stencil"|"inlay"|"relief"|"panel";
type Recipe=readonly [Material,string,string];
/** Individually authored finish and placement guidance. No new artwork IDs or
 * network assets: every entry refers to its own existing distinct composition. */
export const detailedWallRecipes={
 sunDisc:["wash","Living room or headboard","Keep the sun and horizon on one uninterrupted wall."],
 orbit:["inlay","Living or dining accent","Use a muted metallic accent against a dark matte base."],
 layeredArches:["pigment","Bedroom or reading corner","Use closely related shades and keep the arch tops unobstructed."],
 abstractLeaves:["wash","Living room or passage","Leave breathing space around the large leaf shapes."],
 eclipse:["wash","Bedroom feature wall","Soft warm contrasts keep the overlapping discs calm."],
 aurora:["wash","Lounge accent","Use related tones for a continuous ribbon composition."],
 galleryArc:["inlay","Dining or foyer","Center the arc composition on the wall, not the whole room."],
 celestial:["wash","Bedroom","Keep the moon and fine stars clear of shelves."],
 flyingBirds:["wash","Living room","Allow open sky above the bird silhouettes."],
 gardenTree:["wash","Living or reading corner","Position the branching composition away from tall furniture."],
 meadowBloom:["wash","Bedroom or reading corner","Keep the stems at the base and the blooms visible above furniture."],
 desertDunes:["wash","Bedroom or lounge","Use low-contrast earthy shades for the layered dunes."],
 oceanCliffs:["wash","Living room","Keep the shoreline continuous across a broad accent wall."],
 citySilhouette:["pigment","Study or lounge","Align the skyline to a single wall and keep windows clear."],
 floralScroll:["stencil","Dining or bedroom","Use a contrasting vine accent on one broad wall."],
 bamboo:["stencil","Living room or study","Tall vertical stems suit a narrow uninterrupted wall."],
 botanical:["wash","Bedroom or sitting room","Use subtle leaf colours and preserve open space around stems."],
 forest:["wash","Lounge","Layer muted greens and keep the lower woodland edge aligned."],
 mountain:["wash","Bedroom or living room","Keep the peak composition clear above the headboard."],
 waterflow:["wash","Reading or meditation corner","Use gentle tones and avoid abrupt colour transitions."],
 fernStencil:["stencil","Study or bedroom","Fine leaves suit a quiet accent wall rather than every surface."],
 diamonds:["inlay","Dining room","Use fine restrained linework with a contrasting matte base."],
 inset:["panel","Living or dining room","Center the double-frame composition above the skirting."],
 heritage:["stencil","Formal living or entry","Align the decorative borders with the room edges."],
 decoFan:["inlay","Dining or foyer","Use fine warm accents and consistent repeat spacing."],
 artDecoSunburst:["inlay","Living room","Keep the radial composition centered on the feature surface."],
 royalRosette:["stencil","Dining room","Keep the upper and lower rosette borders at a consistent height."],
 jaliMedallion:["stencil","Foyer or dining room","Use a light accent for legible small medallions."],
 ogee:["stencil","Bedroom or passage","Check lattice repeat scale before painting."],
 arch:["pigment","Bedroom or reading corner","Use a soft arch behind a chair or headboard."],
 split:["pigment","Hallway or children's room","Align the horizontal division with room furniture."],
 asymmetric:["pigment","Study or living room","Balance large colour fields with a restrained palette."],
 mural:["wash","Living room","Keep the painted frames and landscape together as one composition."],
 scallop:["pigment","Bedroom","Use a gentle repeating scallop and related shades."],
 steppedColourBlock:["pigment","Study or children's room","Align stepped edges to a level reference line."],
 modernRibbons:["pigment","Living or study","Use two related colours and one stronger accent."],
 offsetCircles:["pigment","Bedroom or study","Preserve the spacing between the circle forms."],
 facets:["relief","Living accent","Keep the hexagonal cluster in a clear open wall area."],
 herringbone:["panel","Dining or bedroom","Maintain an even chevron repeat across the surface."],
 grid:["panel","Study or dining","Align the square grid to the wall and use subtle tonal variation."],
 diagonal:["pigment","Study or lounge","Keep diagonal bands continuous on one wall."],
 panels:["panel","Living room","Place frames in proportion to the sofa and wall height."],
 bands:["panel","Passage or bedroom","Use narrow vertical bands to emphasize height."],
 hexGrid:["relief","Living feature wall","Use muted colour families and consistent hexagonal spacing."],
 angularWeave:["inlay","Study or dining","Use fine wirework with clear spacing, avoiding busy furniture."],
 silkBotanical:["stencil","Bedroom","Soft leaf contrast suits a calm textile-inspired wall."],
 imperialVine:["stencil","Formal dining","Use a balanced repeating vine on an uninterrupted surface."],
 indigoMedallion:["stencil","Dining or foyer","Use a saturated accent sparingly over a warm neutral base."],
 magnoliaRepeat:["stencil","Bedroom","Keep blossom repeat scale large enough to read from the doorway."],
 decoInlay:["inlay","Dining or reception","Use brass-inspired fine highlights rather than glossy whole-wall paint."],
 moroccanFiligree:["inlay","Living or foyer","Maintain fine medallion lines and a restrained accent."],
 palaceFloral:["stencil","Formal living","Use a subdued floral repeat with clear borders."],
 japaneseKamon:["stencil","Study or bedroom","Use sparse colours and consistent emblem spacing."],
 sculptFlute:["relief","Living or TV feature","Vertical highlights are an optical effect, not physical fluting."],
 sculptDiamond:["relief","Dining or living","Use soft directional contrast to retain the faceted illusion."],
 sculptReed:["relief","Passage or TV wall","Keep the narrow shadow pattern subtle to avoid visual noise."],
 sculptStone:["relief","Living room","Use natural warm greys for a painted stone relief impression."],
 sculptPrism:["relief","Living accent","Use restrained tonal facets, not competing bright shades."],
 regencyPanel:["panel","Formal living","Align the painted arches above the skirting."],
 palazzoPanel:["panel","Dining or formal living","Use tall framed fields in proportion to the wall."],
 artHotelPanel:["panel","Bedroom","Center the tall arch grouping behind the bed."],
 walnutPanel:["panel","TV wall or study","Use warm wood-inspired shades; this is paint, not wood veneer."],
 contemporaryPanel:["panel","Living room","Keep the central frame aligned with furniture."],
 grandSalon:["panel","Formal living","Use subtle moulding highlights with a calm base tone."]
} as const satisfies Partial<Record<Pattern,Recipe>>;
export function detailedWallRecipe(key:Pattern):Recipe|undefined{if(isPremiumRaster(key))return ["relief","Living, bedroom or feature wall",premiumRasterNames[key]+": use an uninterrupted wall and verify the optical finish on a sample board; not physical relief."];return (detailedWallRecipes as Partial<Record<Pattern,Recipe>>)[key];}
export function wallFinishStrength(key:Pattern){const recipe=detailedWallRecipe(key);return recipe?{pigment:.016,wash:.035,stencil:.021,inlay:.013,relief:.028,panel:.022}[recipe[0]]:0;}

/** Different finish families require different texture frequency and depth.
 * Keep amplitudes small enough for realistic paint, not noisy wallpaper. */
const materialProfiles:Record<Material,MaterialDetail>={
 pigment:{grain:.012,wash:.016,ridge:0,edge:0,axis:"diagonal"},
 wash:{grain:.022,wash:.065,ridge:0,edge:0,axis:"diagonal"},
 stencil:{grain:.015,wash:.018,ridge:.006,edge:.035,axis:"vertical"},
 inlay:{grain:.009,wash:.025,ridge:.016,edge:.10,axis:"diagonal"},
 relief:{grain:.018,wash:.025,ridge:.018,edge:.15,axis:"vertical"},
 panel:{grain:.012,wash:.020,ridge:.012,edge:.11,axis:"vertical"}
};
export function wallMaterialDetail(key:Pattern):MaterialDetail|undefined{
 const recipe=detailedWallRecipe(key);if(!recipe)return;
 const profile=materialProfiles[recipe[0]];
 if(key==="herringbone"||key==="sculptDiamond"||key==="sculptPrism")return {...profile,axis:"diagonal"};
 if(key==="split"||key==="heritage"||key==="royalRosette")return {...profile,axis:"horizontal"};
 return profile;
}
