import test from "node:test";
import assert from "node:assert/strict";
import {generateFacadeDrafts,facadeKits,massingOptions} from "./facade-drafts.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {structuralSignature} from "./design-publication.ts";
const brief={widthFt:18,depthFt:50,roadSide:"N" as const,floors:2 as const,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("24 geometrically derived, structurally fingerprinted composite concepts, none published",()=>{
 const plans=generateFacadeDrafts(brief);
 assert.equal(facadeKits.length,6);
 assert.equal(massingOptions.length,2);
 assert.equal(plans.length,24);
 assert.equal(new Set(plans.map(x=>x.signature)).size,24);
 assert.ok(plans.every(x=>x.status==="draft"&&x.reasons.length>0));
 assert.equal(new Set(plans.map(x=>x.plan.variant)).size,2);
});
test("colors never make a structural duplicate appear unique",()=>{
 const p=generateFacadeDrafts(brief)[0].plan;
 const altered={...p,facade:{...p.facade,main:"#000000",accent:"#ffffff"}};
 assert.equal(structuralSignature(studioDesignFromPlan(p)),structuralSignature(studioDesignFromPlan(altered)));
});
test("unbuildable briefs do not generate fake 24-design catalog",()=>{
 const drafts=generateFacadeDrafts({...brief,widthFt:15,depthFt:30});
 assert.equal(drafts.length,0);
});
