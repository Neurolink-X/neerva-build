import test from "node:test";
import assert from "node:assert/strict";
import {studioDesigns} from "./library.ts";
import {assessPublication,legacyPublication,structuralSignature,publishedDesigns} from "./design-publication.ts";
import {generateRoadPlans} from "./road-generator.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
test("24 legacy concepts are drafts, not silently published or sold as verified plans",()=>{
 assert.equal(legacyPublication.length,24);
 assert.equal(publishedDesigns.length,0);
 assert.ok(legacyPublication.every(x=>x.status==="draft"&&x.reasons.includes("Not derived from a reviewed PlanModel")));
});
test("duplicate geometry cannot be disguised by changed surface colour",()=>{
 const design=studioDesigns[0];const recoloured={...design,elevation:{...design.elevation,surfaces:{...design.elevation.surfaces,main:"#242424",accent:"#e1dfdc"}}};
 assert.equal(structuralSignature(design),structuralSignature(recoloured));
 assert.ok(assessPublication(design,{alreadyPublished:new Set([structuralSignature(design)])}).reasons.some(x=>x.includes("Duplicate")));
});
test("a real PlanModel geometry mismatch fails closed, and city rules must be approved",()=>{
 const p=generateRoadPlans({widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}}).plans[0];assert.ok(p);
 const model=studioDesignFromPlan(p);
 let decision=assessPublication(model,{plan:p,reviewer:"Pre-review engineering QA"});
 assert.equal(decision.status,"draft");
 assert.ok(decision.reasons.some(x=>x.includes("City rule approval")));
 const wrong={...model,layout:{...model.layout,rooms:model.layout.rooms.map(r=>({...r}))}};
 wrong.layout.rooms[0].xFt+=1;
 assert.ok(assessPublication(wrong,{plan:p}).reasons.some(x=>x.includes("differ from PlanModel")));
});
