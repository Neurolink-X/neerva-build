import test from "node:test";
import assert from "node:assert/strict";
import {areaCost,energyKwh,parseMeasurement,validRange,withAllowance} from "./quantity-math.ts";
import {quickEstimate} from "../home/quick-calculators.ts";
import {areaBudget,steelScheduleTakeoff,steelTakeoff} from "../home/construction-math.ts";
import {convertSquareFeet} from "./units.ts";
test("shared calculator math keeps separate input policies and produces matching valid totals",()=>{
 assert.equal(areaCost(1000,2000,10).total,quickEstimate("budget",[1000,2000,10]));
 assert.equal(areaBudget(1000,2000,10)?.total,quickEstimate("budget",[1000,2000,10]));
 assert.equal(areaBudget(1000,2000,80),null);
 assert.equal(quickEstimate("budget",[1000,2000,80]),3600000);
 assert.equal(energyKwh(100,8,30),quickEstimate("energy-use",[100,8,30]));
 assert.equal(energyKwh(100,8,30,8),quickEstimate("energy",[100,8,30,8]));
 assert.equal(convertSquareFeet(100).squareMetres,quickEstimate("units",[100]));
 assert.ok(Math.abs(withAllowance(100,10)-110)<1e-9);
 assert.equal(steelScheduleTakeoff([{diameterMm:12,lengthM:100}],0)?.firstKgPerM,steelTakeoff(12,100,0)?.kgPerM);
 assert.ok(Number.isNaN(parseMeasurement(" ")));assert.equal(parseMeasurement("0"),0);assert.equal(validRange(Infinity,0,10),false);
});
