import {test} from "node:test";
import assert from "node:assert/strict";
import {quickEstimate} from "./quick-calculators.ts";
const close=(actual:number|null,expected:number)=>{assert.ok(actual!==null);assert.ok(Math.abs(actual-expected)<1e-8,`Expected ${expected}, got ${actual}`)};
test("measured volumes and areas",()=>{close(quickEstimate("excavation",[10,5,3]),150*.028316846592);close(quickEstimate("slab",[100,100]),.9290304);close(quickEstimate("units",[100]),9.290304);assert.equal(quickEstimate("tank",[2,1,1]),2000);assert.equal(quickEstimate("formwork",[10,.3,2]),6)});
test("allowances and tile rounding",()=>{assert.equal(quickEstimate("tiles",[100,600,600,10]),29);close(quickEstimate("paint",[100,2,10,5]),1.95096384);close(quickEstimate("floor",[100,80,30,10]),11800);close(quickEstimate("plaster",[100,12,5]),100*.09290304*.012*1.05);close(quickEstimate("roof",[1000,50,10]),1050*.09290304*1.1)});
test("invalid input rejection",()=>{assert.equal(quickEstimate("paint",[100,2,0,5]),null);assert.equal(quickEstimate("tiles",[100,0,600,10]),null);assert.equal(quickEstimate("floor",[100,80,30,101]),null);assert.equal(quickEstimate("tank",[NaN,1,1]),null);assert.equal(quickEstimate("formwork",[10,.3,1.5]),null)});

test("resource and budget scenarios",()=>{assert.equal(quickEstimate("rainwater",[100,100,80]),8000);assert.equal(quickEstimate("rainwater",[100,100,101]),null);assert.equal(quickEstimate("energy",[100,8,30,8]),192);assert.equal(quickEstimate("energy",[100,25,30,8]),null);close(quickEstimate("budget",[1000,2000,10]),2200000);assert.equal(quickEstimate("budget",[1000,2000,101]),null)});

test("lifecycle, specified proportions and pack planning",()=>{assert.equal(quickEstimate("lifecycle",[100000,5000,20]),200000);assert.equal(quickEstimate("lifecycle",[100000,5000,101]),null);assert.equal(quickEstimate("mortar",[100,1,4]),20);assert.equal(quickEstimate("mortar",[100,0,4]),null);assert.equal(quickEstimate("packs",[100,20,5]),6);assert.equal(quickEstimate("packs",[100,0,5]),null)});

test("openable area ratio",()=>{assert.equal(quickEstimate("ventilation",[20,2]),10);assert.equal(quickEstimate("ventilation",[0,2]),null)});

test("modular pitch count",()=>{assert.equal(quickEstimate("module-grid",[3600,600]),6);assert.equal(quickEstimate("module-grid",[3700,600]),6);assert.equal(quickEstimate("module-grid",[3600,0]),null)});
