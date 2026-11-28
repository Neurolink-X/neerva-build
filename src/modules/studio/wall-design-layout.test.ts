import test from "node:test";
import assert from "node:assert/strict";
import {artworkFrame} from "./wall-design-layout.ts";
import {collectionGuide,featureWallPatterns} from "./wall-design-guide.ts";
import {patternGroups,patternKeys} from "./wall-patterns.ts";
const rect=(w:number,h:number)=>[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
test("feature wall art stays centred and proportionate on wide or tall walls",()=>{
 assert.deepEqual(artworkFrame(rect(600,400),true),{u:0,v:0,w:1,h:1});
 assert.deepEqual(artworkFrame(rect(1200,400),true),{u:.25,v:0,w:.5,h:1});
 const tall=artworkFrame(rect(300,600),true);assert.equal(tall.w,1);assert.ok(Math.abs(tall.h-1/3)<1e-8);assert.ok(Math.abs(tall.v-(1-tall.h)/2)<1e-8);
 assert.deepEqual(artworkFrame(rect(1200,400),false),{u:0,v:0,w:1,h:1});
});
test("collection guidance is aligned with the only active catalogue",()=>{
 assert.deepEqual(Object.keys(collectionGuide).sort(),Object.keys(patternGroups).sort());
 assert.ok(featureWallPatterns.every(p=>patternKeys.includes(p)));
});

test("focal art fits above the sample sofa without changing its aspect",()=>{const f=artworkFrame(rect(600,400),true,.7);assert.ok(f.v+f.h<=.7+1e-8);assert.ok(Math.abs(600*f.w/(400*f.h)-1.5)<1e-8);});

import {isFeatureWall} from "./wall-design-guide.ts";
import {premiumRasterNames} from "./premium-wall-raster.ts";
test("all replacement artwork fills the selected wall; retain original orbit and blossom IDs",()=>{assert.equal(Object.keys(premiumRasterNames).length,27);assert.ok(patternGroups.Signature.filter(k=>k!=="orbit").every(k=>Object.hasOwn(premiumRasterNames,k)));assert.ok(patternGroups.Nature.filter(k=>k!=="blossomBranch").every(k=>Object.hasOwn(premiumRasterNames,k)));assert.ok(patternGroups.Modern.every(k=>Object.hasOwn(premiumRasterNames,k)));assert.equal(isFeatureWall("orbit"),true);for(const k of Object.keys(premiumRasterNames) as (keyof typeof premiumRasterNames)[])assert.equal(isFeatureWall(k),false);});
