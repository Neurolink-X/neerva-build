import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {wallTextures,texturePalette,appliedWallTextureKeys,imageBasedWallPatterns,wallTextureCrop,hasWallRaster} from "./wall-textures.ts";
import {encodedPhotoDimensions} from "./photo-budget.ts";
import {patternGroups} from "./wall-patterns.ts";
test("eight verified local textures are distinct, within budget and attached to visible patterns",()=>{const entries=Object.entries(wallTextures);assert.equal(entries.length,8);let total=0;const hashes=new Set<string>();for(const [key,m] of entries){assert.ok(Object.values(patternGroups).flat().some(p=>p===key));const bytes=readFileSync(new URL("../../../public"+m.src,import.meta.url));assert.equal(bytes.length,m.bytes);assert.equal(createHash("sha256").update(bytes).digest("hex"),m.sha256);assert.deepEqual(encodedPhotoDimensions(bytes),{width:m.width,height:m.height});hashes.add(m.sha256);total+=m.bytes;}assert.equal(hashes.size,8);assert.ok(total<260000);});
test("texture pigments preserve contrast and respond to both shades",()=>{const p=texturePalette("#dddddd","#304050");assert.equal(p.length,256);assert.ok(p[0][0]<p[255][0]);assert.notDeepEqual(p,texturePalette("#aaaaaa","#304050"));assert.notDeepEqual(p,texturePalette("#dddddd","#805030"));assert.ok(p.flat().every(v=>Number.isInteger(v)&&v>=0&&v<=255));});

test("inactive scenes and replaced walls cannot block export waiting for textures",()=>{const style={colour:"#abcdef",accent:"#112233",opacity:.78,pattern:"sculptWave" as const};const common={target:"right" as const,facadeStyles:{right:style,left:{...style,pattern:"lotusPond" as const}},walls:[{pattern:"riverSunset" as const}],editing:0,valid:true,effectivePattern:"plain" as const};assert.deepEqual(appliedWallTextureKeys({...common,scene:"room"}),[]);assert.deepEqual(appliedWallTextureKeys({...common,scene:"facade"}),["lotusPond"]);assert.deepEqual(appliedWallTextureKeys({...common,scene:"facade",target:"all"}),["sculptWave","lotusPond"]);assert.deepEqual(appliedWallTextureKeys({...common,scene:"custom",editing:null,valid:false}),["riverSunset"]);});

test("all eight image finishes are discoverable and full-wall crop preserves aspect",()=>{assert.equal(imageBasedWallPatterns.length,8);assert.equal(new Set(imageBasedWallPatterns).size,8);assert.deepEqual(wallTextureCrop(960,480,1),[.25,0,.5,1]);assert.deepEqual(wallTextureCrop(800,800,2),[0,.25,1,.5]);assert.deepEqual(wallTextureCrop(800,400,2),[0,0,1,1]);assert.deepEqual(wallTextureCrop(0,400,2),[0,0,1,1]);});

test("procedural relief and mural rasters remain in the 64 original non-image designs",()=>{assert.equal(hasWallRaster("sculptDiamond"),true);assert.equal(hasWallRaster("oceanCliffs"),true);assert.equal(hasWallRaster("arch"),false);assert.equal(imageBasedWallPatterns.length,8);});
