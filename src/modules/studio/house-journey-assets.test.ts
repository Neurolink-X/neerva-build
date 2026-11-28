import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync,existsSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {verifyHouseJourney} from "./house-journey-assets.ts";
import {houseJourney,houseJourneyImageUrl,houseJourneyLocalPatterns} from "./house-journey.ts";
import {facadeSamples} from "./facade-paint.ts";
import {validWallMask} from "./mask-editor.ts";
test("missing pair never activates new masks or image paths",()=>{
 const root=mkdtempSync(join(tmpdir(),"neerva-journey-"));
 try{assert.equal(verifyHouseJourney(root),false)}finally{rmSync(root,{recursive:true,force:true})}
});
test("new facade masks stay normalized and pair fits the local asset budget",()=>{
 const s=facadeSamples[0];
 assert.equal(s.src,houseJourney.finished.src);
 assert.ok(s.zones.length>=6);
 assert.equal(new Set(s.zones.map(z=>z.id)).size,s.zones.length);
 for(const z of s.zones){assert.ok(validWallMask(z.points),z.id);for(const ring of [z.mask.outline,...z.mask.holes])for(const [x,y] of ring)assert.ok(x>=0&&x<=1&&y>=0&&y<=1);}
 assert.ok(houseJourney.finished.bytes+houseJourney.shell.bytes<220000);
});
test("release requires both reviewed local construction stages",()=>{
 for(const a of [houseJourney.finished,houseJourney.shell])assert.ok(existsSync(join(process.cwd(),"public",a.src.slice(1))),"Missing required image: "+a.src);
 assert.ok(verifyHouseJourney(),"Both reviewed image files must match their exact SHA-256 and dimensions.");
});

test("stable journey paths retain current reviewed bytes and digest-versioned browser URLs",()=>{
 assert.equal(houseJourney.finished.src,"/images/studio/journey-finished.webp");
 assert.equal(houseJourney.shell.src,"/images/studio/journey-shell.webp");
 for(const a of [houseJourney.finished,houseJourney.shell]){
  assert.equal(houseJourneyImageUrl(a.src),a.src+"?v="+a.sha256.slice(0,16));
 }
 assert.equal(houseJourneyImageUrl("/images/studio/paint-room.webp"),"/images/studio/paint-room.webp");
 assert.notEqual(houseJourneyImageUrl(houseJourney.finished.src),houseJourneyImageUrl(houseJourney.shell.src));
 assert.ok(verifyHouseJourney());
});

test("Next image optimizer admits exactly the reviewed cache-versioned journey URLs",()=>{
 assert.equal(houseJourneyLocalPatterns.length,2);
 for(const a of [houseJourney.finished,houseJourney.shell]){
  const url=new URL(houseJourneyImageUrl(a.src),"https://example.test");
  assert.ok(houseJourneyLocalPatterns.some(p=>p.pathname===url.pathname&&p.search===url.search));
 }
 assert.ok(houseJourneyLocalPatterns.every(p=>/^\\?v=[a-f0-9]{16}$/.test(p.search)&&!p.pathname.includes("*")));
 const config=readFileSync(new URL("../../../next.config.ts",import.meta.url),"utf8");
 assert.match(config,/localPatterns:\s*\[\{pathname:"\/\*\*",search:""\},\s*\.\.\.houseJourneyLocalPatterns\]/);
});
