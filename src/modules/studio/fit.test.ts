import assert from "node:assert/strict";
import test from "node:test";
import {studioDesigns} from "./library.ts";
import {ADVISORY_MIN_ROOM_SQFT,DESIGN_CITIES,evaluatePlotFit,rankStudioDesigns,sqFtToGaj,toFeet,validatePlotBrief,type PlotBrief,type VerifiedCityRules} from "./fit.ts";
const d=(slug:string)=>{const value=studioDesigns.find(d=>d.slug===slug);assert.ok(value);return value};
const brief:PlotBrief={widthFt:20,depthFt:40,city:"Kanpur",facing:"North",roadSide:"North",floors:1,bedrooms:2,parking:true};
test("all initial city labels are research-only, no fabricated regulation",()=>{
 assert.deepEqual([...DESIGN_CITIES],["Kanpur","Ranchi","Lucknow","Jhansi","Mumbai"]);
 assert.equal(ADVISORY_MIN_ROOM_SQFT.habitable,100);
});
test("units are dimensionally correct; gaj is area, never linear width",()=>{
 assert.ok(Math.abs(toFeet(6.096,"m")-20)<.001);
 assert.equal(toFeet(40,"ft"),40);assert.equal(sqFtToGaj(900),100);
});
test("invalid briefs fail closed",()=>{
 assert.ok(validatePlotBrief({...brief,widthFt:NaN}).length);
 assert.ok(validatePlotBrief({...brief,bedrooms:7}).length);
 assert.equal(evaluatePlotFit(d("20x40-warm-modern"),{...brief,widthFt:3}).grade,"does-not-fit");
});
test("small plots never pass dimension gate or receive a high score",()=>{
 const score=evaluatePlotFit(d("40x60-warm-modern"),brief);
 assert.equal(score.plotDimensionsFit,false);assert.equal(score.grade,"does-not-fit");assert.ok(score.score<20);
});
test("20x40 with car and stairs is not incorrectly advertised as approved",()=>{
 const x=evaluatePlotFit(d("20x40-warm-modern"),brief);
 assert.equal(x.needsLocalApproval,true);assert.ok(x.notes.some(n=>n.includes("Parking space")));
 assert.ok(x.notes.some(n=>n.includes("not yet verified")));
 assert.equal(x.meetsRequestedBrief,true);
});
test("compact plans expose undersized living space",()=>{
 const x=evaluatePlotFit(d("15x30-warm-modern"),{...brief,widthFt:15,depthFt:30,bedrooms:1,parking:false});
 assert.ok(x.notes.some(n=>n.includes("Living / dining")));
});
test("verified setbacks can block a design; missing approval never implies verified",()=>{
 const rules:VerifiedCityRules={city:"Kanpur",authority:"Test authority",sourceUrl:"https://example.org/test",verifiedOn:"2026-11-20",status:"verified",setbacks:{frontFt:10,rearFt:10,leftFt:5,rightFt:5},minimumsSqFt:{habitable:100,kitchen:48,bath:20}};
 const x=evaluatePlotFit(d("20x40-warm-modern"),brief,rules);assert.equal(x.grade,"does-not-fit");
 assert.ok(x.blockers.some(n=>n.includes("building envelope")));
 const another=evaluatePlotFit(d("20x40-warm-modern"),{...brief,city:"Ranchi"},rules);assert.ok(another.notes.some(n=>n.includes("not yet verified")));
});
test("ranked matches are deterministic with exact-size priority and never invented costs",()=>{
 const result=rankStudioDesigns(studioDesigns,brief);
 assert.equal(result.length,24);
 assert.ok(result[0].fit.plotDimensionsFit);
 assert.ok(result[0].fit.score>=result.at(-1)!.fit.score);
 for(const entry of result){assert.equal(entry.fit.needsLocalApproval,true);assert.ok(entry.fit.score<=94);}
});
