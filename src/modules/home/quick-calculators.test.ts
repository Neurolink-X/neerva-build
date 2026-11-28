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

test("durable resource and drainage calculations",()=>{assert.equal(quickEstimate("slope",[5,2]),100);assert.equal(quickEstimate("slope",[0,2]),null);assert.equal(quickEstimate("reuse",[1000,700]),70);assert.equal(quickEstimate("reuse",[100,101]),null);assert.equal(quickEstimate("energy-use",[100,8,30]),24);assert.equal(quickEstimate("energy-use",[100,25,30]),null)});

import {calculatorSpecs,calculatorErrors,calculatorBreakdown,calculatorFormulas} from "./quick-calculators.ts";
test("every calculator has explicit validation, a formula and finite example result",()=>{
 for(const spec of calculatorSpecs){
  const values:number[]=spec.fields.map(f=>f[1]);const result=quickEstimate(spec.id,values);
  assert.ok(result!==null&&Number.isFinite(result),spec.id);
  assert.ok(calculatorFormulas[spec.id].length>10);
  assert.ok(calculatorErrors(spec.id,values).every(e=>!e));
  for(let i=0;i<values.length;i++){
   const bad=[...values];bad[i]=NaN;assert.ok(calculatorErrors(spec.id,bad)[i]);assert.equal(quickEstimate(spec.id,bad),null);
  }
  assert.ok(calculatorBreakdown(spec.id,values,result).every(r=>Number.isFinite(r.value)));
 }
});
test("zero dimensions, fractional counts and invalid cross-field values are rejected",()=>{
 assert.equal(quickEstimate("excavation",[0,5,3]),null);
 assert.equal(quickEstimate("slab",[100,0]),null);
 assert.equal(quickEstimate("tank",[2,1,0]),null);
 assert.ok(calculatorErrors("paint",[100,1.5,10,5])[1]);
 assert.ok(calculatorErrors("reuse",[100,101])[1]);
 assert.equal(quickEstimate("rainwater",[100,0,80]),0);
 assert.equal(quickEstimate("energy-use",[100,0,30]),0);
 assert.deepEqual(calculatorBreakdown("budget",[1000,2000,10],2200000).map(r=>r.value),[2000000,200000]);
});

import {calculatorScenario,compareCalculatorScenarios,calculatorReport} from "./quick-calculators.ts";
test("scenario reports are reproducible and comparisons stay within matching calculators",()=>{
 const first=calculatorScenario("budget",[1000,2000,10])!,next=calculatorScenario("budget",[1000,2200,10])!;
 assert.ok(first&&next);
 const comparison=compareCalculatorScenarios(first,next);assert.ok(comparison);
 assert.ok(Math.abs(comparison.difference-220000)<1e-6);
 assert.ok(Math.abs((comparison.percent??0)-10)<1e-6);
 assert.equal(compareCalculatorScenarios(first,calculatorScenario("tank",[2,1,1])!),null);
 assert.equal(compareCalculatorScenarios({...first,result:1},next),null);
 assert.equal(compareCalculatorScenarios(calculatorScenario("energy-use",[100,0,30])!,calculatorScenario("energy-use",[100,8,30])!)?.percent,null);
 assert.match(calculatorReport(first),/Contingency: 2,00,000/);
 assert.equal(quickEstimate("tank",[1e9,1e9,1e9]),null);
 assert.equal(quickEstimate("tiles",[100,1e-12,600,10]),null);
});

test("whole operating days and explicit quantity allowance breakdowns",()=>{assert.equal(quickEstimate("energy",[100,8,1.5,8]),null);assert.equal(quickEstimate("energy-use",[100,8,1.5]),null);assert.equal(quickEstimate("energy-use",[100,8,0]),0);const paint=calculatorBreakdown("paint",[100,2,10,5],quickEstimate("paint",[100,2,10,5])!);close(paint[0].value+paint[1].value,1.95096384);const tile=calculatorBreakdown("tiles",[100,600,600,10],29);assert.ok(tile[2].value>=tile[1].value);});
