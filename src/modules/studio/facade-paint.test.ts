import test from "node:test";
import assert from "node:assert/strict";
import {facadeZones,facadeSamples,stylesForTarget,activePattern,shadedPixel,type PaintStyle} from "./facade-paint.ts";
import {validWallMask} from "./mask-editor.ts";
const plain:PaintStyle={colour:"#b6c7a3",accent:"#c4925f",pattern:"plain",opacity:.78};
test("all sample exterior paint sections have independent normalized masks",()=>{
 assert.equal(new Set(facadeZones.map(z=>z.id)).size,5);
 for(const z of facadeZones){assert.ok(validWallMask(z.points),z.id);for(const ring of [z.mask.outline,...z.mask.holes])for(const [x,y] of ring)assert.ok(x>=0&&x<=1&&y>=0&&y<=1,z.id);}
 assert.equal(facadeZones.find(z=>z.id==="right")?.mask.holes.length,2);
});
test("plain paint is independent of stored pattern and selected base shade",()=>{
 assert.equal(activePattern("paint","diamonds"),"plain");
 assert.equal(activePattern("design","diamonds"),"diamonds");
 const full=stylesForTarget({},"all",plain);
 assert.equal(Object.keys(full).length,5);
 const design=stylesForTarget(full,"right",{...plain,pattern:activePattern("design","diamonds")});
 assert.equal(design.right?.colour,plain.colour);
 assert.equal(design.right?.pattern,"diamonds");
 assert.equal(design.left?.pattern,"plain");
 assert.equal(full.right?.pattern,"plain");
 const changed=stylesForTarget(design,"right",{...plain,colour:"#446699",pattern:"plain"});
 assert.equal(changed.right?.colour,"#446699");assert.equal(changed.left?.colour,plain.colour);
});
test("shade calculation retains light and shadow and supports both pale and deep paint",()=>{
 const pale=[240,234,220],deep=[38,55,70];
 const lit=shadedPixel(220,220,220,pale),dark=shadedPixel(90,90,90,pale);
 assert.ok(lit.every((v,i)=>v>dark[i]));
 assert.ok(shadedPixel(190,190,190,pale).every((v,i)=>v===pale[i]));
 assert.ok(shadedPixel(190,190,190,deep).every((v,i)=>v===deep[i]));
});

test("each local house has its own validated paint zones and independent whole-exterior selection",()=>{
 assert.equal(facadeSamples.length,3);
 assert.equal(new Set(facadeSamples.map(s=>s.src)).size,3);
 for(const s of facadeSamples){assert.ok(s.src.startsWith("/images/studio/"));assert.ok(s.zones.length>=3);const styles=stylesForTarget({},"all",plain,s.zones);assert.equal(Object.keys(styles).length,s.zones.length);for(const z of s.zones){assert.ok(validWallMask(z.points),s.id+" "+z.id);for(const ring of [z.mask.outline,...z.mask.holes])for(const [x,y] of ring)assert.ok(x>=0&&x<=1&&y>=0&&y<=1);}}
});
