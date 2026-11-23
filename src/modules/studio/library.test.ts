import assert from "node:assert/strict";
import test from "node:test";
import {studioDesigns,findStudioDesign,validateStudioDesign,paintEstimate,wallPatches} from "./library.ts";
test("six plot sizes × four styles: exactly 24 original concepts",()=>{
 assert.equal(studioDesigns.length,24);assert.equal(new Set(studioDesigns.map(d=>d.slug)).size,24);
 const plots=[...new Set(studioDesigns.map(d=>d.plot.widthFt+"x"+d.plot.depthFt))];assert.equal(plots.length,6);
 for(const plot of plots)assert.equal(studioDesigns.filter(d=>d.plot.widthFt+"x"+d.plot.depthFt===plot).length,4);
});
test("consistent areas, room layouts and openings",()=>{for(const d of studioDesigns)assert.deepEqual(validateStudioDesign(d),[],d.slug)});
test("flat roofs and unverified prices never masquerade as quotes",()=>{
 for(const d of studioDesigns){assert.equal(d.roof,"flat-rcc");assert.ok(d.layout.parapetHeightFt>0);assert.equal(d.costRangePerSqFt.status,"pending-admin-verification");assert.equal(d.costRangePerSqFt.minInr,null);}
});
test("each design has a stable deep link",()=>{for(const d of studioDesigns)assert.equal(findStudioDesign(d.slug)?.id,d.id);assert.equal(findStudioDesign("absent"),undefined)});
test("paint area subtracts all openings",()=>{const p=paintEstimate(studioDesigns[0]);assert.ok(p.netSqM>0&&p.netSqM<p.grossSqM);assert.ok(p.litres>0);assert.throws(()=>paintEstimate(studioDesigns[0],0),RangeError)});
test("door and window positions create real voids in wall tessellation",()=>{
 const r=studioDesigns[0].layout.rooms.find(r=>r.kind==="living");assert.ok(r);
 const patches=wallPatches(r);
 for(const o of r.openings)assert.equal(patches.some(p=>p.side===o.wall&&p.startFt<o.offsetFt+o.widthFt&&p.endFt>o.offsetFt&&p.bottomFt<o.sillFt+o.heightFt&&p.topFt>o.sillFt),false);
});