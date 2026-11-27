import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts} from "./building-purpose.ts";
import {generateSpatialPortfolio} from "./road-generator.ts";
import {applyRoomFinish,defaultFinishScheme,finishEstimate,finishSpaces,shadeRgb,wallShade,wallFaceOwners,setRoomMaterial} from "./finish-model.ts";
import {buildingRenderSnapshot} from "./building-render.ts";
import {commercialInteriorSnapshot} from "./commercial-interior-render.ts";
import {finishPackEstimate} from "./finish-procurement.ts";
import type {ProjectSource} from "./project-exchange.ts";
test("all six building purposes use isolated room and floor finishes without mutating geometry",()=>{
 const h=generateSpatialPortfolio({widthFt:40,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}},1).plans[0];assert.ok(h);
 const sources:ProjectSource[]=[{kind:"residential",plan:h}];
 for(const purpose of ["mall","school","restaurant","shops","rental"] as const){const p=generateBuildingConcepts(buildingStarter(purpose),1).plans[0];assert.ok(p,purpose);sources.push({kind:"commercial",plan:p});}
 for(const source of sources){
  const before=JSON.stringify(source),scheme=defaultFinishScheme(source),rooms=finishSpaces(source);assert.ok(rooms.length);
  const id=rooms[0].id,changed=applyRoomFinish(source,scheme,[id,"unknown"],"floor","#112233");
  assert.equal(changed.rooms[id].floor,"#112233");assert.equal(changed.rooms[id].wall,scheme.rooms[id].wall);
  for(const room of rooms.slice(1))assert.deepEqual(changed.rooms[room.id],scheme.rooms[room.id]);
  assert.equal(JSON.stringify(source),before);assert.equal(applyRoomFinish(source,scheme,[id],"wall","invalid"),scheme);
  const estimate=finishEstimate(source,rooms.map(r=>r.id),10,2);assert.ok(estimate);assert.ok(estimate.paintLitres>0);assert.ok(estimate.wallSqFt<=estimate.grossWallSqFt);
  assert.equal(finishEstimate(source,[id],0,2),null);
  if(source.kind==="commercial"){
   const expected=source.plan.zones.filter(z=>!["open","parking"].includes(z.kind)).reduce((n,z)=>n+z.w*z.d,0);
   assert.ok(Math.abs(estimate.floorSqFt-expected)<1e-5,"rental rooms must replace, not duplicate their parent area");
   const snap=buildingRenderSnapshot(source.plan,"limestone",false,"front",{...scheme,exterior:"#112233",glass:"#224466"});
   assert.ok(snap.boxes.some(b=>b.color.every((n,i)=>Math.abs(n-shadeRgb("#112233")[i])<1e-7)));
  }
 }
});

test("shared partition retains independent opposite-side finishes",()=>{
 const a={id:"a",label:"A",kind:"room",floor:0,x:0,y:0,w:10,d:12},b={...a,id:"b",x:10};
 assert.deepEqual(wallFaceOwners([a,b],{axis:"x",floorIndex:0,planeFt:10,startFt:2,endFt:8}),[{id:"a",side:"right",inward:-1},{id:"b",side:"left",inward:1}]);
 const p=generateBuildingConcepts(buildingStarter("restaurant"),1).plans[0];assert.ok(p);
 const source:ProjectSource={kind:"commercial",plan:p},scheme=defaultFinishScheme(source),id=finishSpaces(source).find(r=>r.kind==="primary")!.id;
 const edited=applyRoomFinish(source,scheme,[id],"wall","#123456","left");
 assert.equal(wallShade(edited.rooms[id],"left","#ffffff"),"#123456");assert.equal(wallShade(edited.rooms[id],"right","#ffffff"),scheme.rooms[id].wall);
 const tiled=setRoomMaterial(source,edited,[id],"floor","marble");assert.equal(tiled.rooms[id].materials?.floor,"marble");
 const snap=commercialInteriorSnapshot(p,tiled,id);assert.ok(snap);assert.ok(snap.boxes.length>6);assert.ok(snap.boxes.every(b=>b.hi.every((n,i)=>n>b.lo[i])));
 assert.ok(snap.boxes.some(b=>b.color.every((n,i)=>Math.abs(n-shadeRgb("#123456")[i])<1e-7)));
 assert.equal(commercialInteriorSnapshot(p,{...tiled,planId:"other"},id),null);
});
test("pack calculator rounds up only after verified coverage and allowance",()=>{
 assert.deepEqual(finishPackEstimate({netSqFt:100,coverageSqFtPerPack:12,wastagePercent:10}),{netSqFt:100,allowanceSqFt:10,requiredSqFt:110,packs:10,orderedCoverageSqFt:120});
 assert.equal(finishPackEstimate({netSqFt:100,coverageSqFtPerPack:0,wastagePercent:10}),null);
 assert.equal(finishPackEstimate({netSqFt:100,coverageSqFtPerPack:12,wastagePercent:31}),null);
});
