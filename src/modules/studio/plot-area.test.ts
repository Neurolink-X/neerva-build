import test from "node:test";
import assert from "node:assert/strict";
import {depthFromGaj,gajFromFeet} from "./plot-area.ts";
test("real gaj area needs frontage, never invents site geometry",()=>{
 for(const [gaj,width,depth] of [[120,20,54],[130,26,45],[140,20,63],[150,30,45]] as const){
  assert.equal(depthFromGaj(gaj,width),depth);
  assert.equal(gajFromFeet(width,depth),gaj);
 }
 assert.equal(depthFromGaj(120,0),null);
 assert.equal(depthFromGaj(120,2),null);
 assert.equal(depthFromGaj(120,200),null);
 assert.equal(depthFromGaj(Number.NaN,20),null);
 assert.equal(depthFromGaj(150,20),67.5);
});

import {areaToSquareFeet,solvePlotDimension,measuredPlotSummary} from "./plot-area.ts";
test("plot conversion supports both dimensions and three explicit area units",()=>{
 assert.equal(solvePlotDimension(100,"gaj",18,"depth"),50);
 assert.equal(solvePlotDimension(900,"sqft",50,"width"),18);
 assert.equal(solvePlotDimension(900*.3048*.3048,"sqm",18,"depth"),50);
 assert.equal(solvePlotDimension(100,"gaj",0,"depth"),null);
 assert.equal(solvePlotDimension(100,"gaj",Infinity,"width"),null);
 assert.equal(solvePlotDimension(100000,"sqft",20,"depth"),null);
 assert.equal(areaToSquareFeet(-1,"sqm"),null);
 assert.equal(measuredPlotSummary(18,50)?.gaj,100);
 assert.equal(measuredPlotSummary(18,50,20)?.sqft,880);
 assert.equal(measuredPlotSummary(18,50,900),null);
 assert.equal(measuredPlotSummary(18,50)?.perimeterFt,136);
});
