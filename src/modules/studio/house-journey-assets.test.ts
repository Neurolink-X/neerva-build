import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync,existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {verifyHouseJourney} from "./house-journey-assets.ts";
import {houseJourney} from "./house-journey.ts";
import {journeyFacadeSamples} from "./facade-paint.ts";
import {validWallMask} from "./mask-editor.ts";
test("missing pair never activates new masks or image paths",()=>{
 const root=mkdtempSync(join(tmpdir(),"neerva-journey-"));
 try{assert.equal(verifyHouseJourney(root),false)}finally{rmSync(root,{recursive:true,force:true})}
});
test("new facade masks stay normalized and pair fits the local asset budget",()=>{
 const s=journeyFacadeSamples[0];
 assert.equal(s.src,houseJourney.finished.src);
 assert.ok(s.zones.length>=6);
 assert.equal(new Set(s.zones.map(z=>z.id)).size,s.zones.length);
 for(const z of s.zones){assert.ok(validWallMask(z.points),z.id);for(const ring of [z.mask.outline,...z.mask.holes])for(const [x,y] of ring)assert.ok(x>=0&&x<=1&&y>=0&&y<=1);}
 assert.ok(houseJourney.finished.bytes+houseJourney.shell.bytes<220000);
 const presence=[houseJourney.finished,houseJourney.shell].map(a=>existsSync(join(process.cwd(),"public",a.src.slice(1))));
 if(presence.some(Boolean))assert.ok(verifyHouseJourney(),"both reviewed image files must be present and match their digest");
});
