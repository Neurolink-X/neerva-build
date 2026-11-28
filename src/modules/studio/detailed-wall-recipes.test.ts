import test from "node:test";
import assert from "node:assert/strict";
import {patternGroups,artworkMotifs} from "./wall-patterns.ts";
import {textureFor} from "./wall-textures.ts";
import {detailedWallRecipes,detailedWallRecipe,wallFinishStrength} from "./detailed-wall-recipes.ts";
test("all 60 non-photo interior designs have a specific material and placement recipe",()=>{const keys=Object.values(patternGroups).flat().filter(k=>!textureFor(k));assert.equal(keys.length,60);assert.equal(Object.keys(detailedWallRecipes).length,64);assert.deepEqual([...keys].sort(),Object.keys(detailedWallRecipes).filter(k=>!textureFor(k as keyof typeof detailedWallRecipes)).sort());assert.equal(new Set(keys.map(k=>detailedWallRecipe(k)?.[2])).size,60);for(const k of keys){assert.ok(wallFinishStrength(k)>0&&wallFinishStrength(k)<=.035);assert.ok(artworkMotifs(k).length>0);}});
test("nested arches and bamboo are new compositions rather than shifted replicas",()=>{assert.notDeepEqual(artworkMotifs("arch").map(m=>m.points),artworkMotifs("layeredArches").map(m=>m.points));assert.notDeepEqual(artworkMotifs("bamboo").map(m=>m.points),artworkMotifs("imperialVine").map(m=>m.points));});
