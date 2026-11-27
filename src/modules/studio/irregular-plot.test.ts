import test from "node:test";
import assert from "node:assert/strict";
import {parsePlot,validatePlot,polygonArea,envelopeFits,roadEnvelope} from "./irregular-plot.ts";
const rectangle=[{x:0,y:0},{x:80,y:0},{x:80,y:100},{x:0,y:100}];
test("rectangular plot retains its exact envelope and area",()=>{
 assert.equal(validatePlot(rectangle),null);assert.equal(polygonArea(rectangle),8000);
 assert.deepEqual(roadEnvelope(rectangle),{x:0,y:0,w:80,d:100});
 assert.deepEqual(roadEnvelope([...rectangle].reverse()),{x:0,y:0,w:80,d:100});
});
test("concave notch cannot be hidden by four inside corners",()=>{
 const p=[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:65,y:100},{x:65,y:40},{x:55,y:40},{x:55,y:100},{x:0,y:100}];
 assert.equal(validatePlot(p),null);assert.equal(envelopeFits(p,{x:0,y:0,w:100,d:100}),false);
 const fit=roadEnvelope(p);assert.ok(fit);assert.ok(envelopeFits(p,fit));assert.ok(fit.w*fit.d<polygonArea(p));
});
test("L and trapezoid envelopes stay inside actual boundary",()=>{
 for(const s of ["0,0\n100,0\n100,60\n50,60\n50,120\n0,120","0,0\n100,0\n80,120\n20,120"]){
 const p=parsePlot(s)!;assert.equal(validatePlot(p),null);const fit=roadEnvelope(p);assert.ok(fit);assert.ok(envelopeFits(p,fit));}
});
test("invalid, crossing and roadless plots fail closed",()=>{
 for(const s of ["0,0\n100,100\n0,100\n100,0","0,0\n100,0\n0,0","0,10\n100,10\n0,100"]){const p=parsePlot(s)!;assert.ok(validatePlot(p));assert.equal(roadEnvelope(p),null);}
 assert.equal(parsePlot("NaN,0"),null);
});
