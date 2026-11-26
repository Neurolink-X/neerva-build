import test from "node:test";
import assert from "node:assert/strict";
import {facadeZones,facadeSamples,stylesForTarget,activePattern,shadedPixel,type PaintStyle} from "./facade-paint.ts";
import {validWallMask} from "./mask-editor.ts";
const plain:PaintStyle={colour:"#b6c7a3",accent:"#c4925f",pattern:"plain",opacity:.78};
test("all sample exterior paint sections have independent normalized masks",()=>{
 assert.equal(new Set(facadeZones.map(z=>z.id)).size,9);
 for(const z of facadeZones){assert.ok(validWallMask(z.points),z.id);for(const ring of [z.mask.outline,...z.mask.holes])for(const [x,y] of ring)assert.ok(x>=0&&x<=1&&y>=0&&y<=1,z.id);}
 assert.equal(facadeZones.find(z=>z.id==="right")?.mask.holes.length,2);
});
test("plain paint is independent of stored pattern and selected base shade",()=>{
 assert.equal(activePattern("paint","diamonds"),"plain");
 assert.equal(activePattern("design","diamonds"),"diamonds");
 const full=stylesForTarget({},"all",plain);
 assert.equal(Object.keys(full).length,9);
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
 assert.equal(facadeSamples.length,4);
 assert.equal(new Set(facadeSamples.map(s=>s.src)).size,4);
 for(const s of facadeSamples){assert.ok(s.src.startsWith("/images/studio/"));assert.ok(s.zones.length>=3);const styles=stylesForTarget({},"all",plain,s.zones);assert.equal(Object.keys(styles).length,s.zones.length);for(const z of s.zones){assert.ok(validWallMask(z.points),s.id+" "+z.id);for(const ring of [z.mask.outline,...z.mask.holes])for(const [x,y] of ring)assert.ok(x>=0&&x<=1&&y>=0&&y<=1);}}
});

test("deep green remains dark on a bright beige wall instead of inheriting beige luminance",()=>{const rgb=[41,63,54];const lit=shadedPixel(220,204,178,rgb);assert.ok(lit[1]>lit[0]&&lit[1]>lit[2]);assert.ok(Math.max(...lit)<90);assert.ok(shadedPixel(110,100,90,rgb)[1]<lit[1]);});

test("full exterior covers previously omitted wall and trim regions in all local samples",()=>{
 function inside(ring:number[][],x:number,y:number){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [a,b]=ring[i],[c,d]=ring[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit;}
 function painted(sample:typeof facadeSamples[number],x:number,y:number){return sample.zones.some(z=>inside(z.mask.outline,x,y)&&!z.mask.holes.some(h=>inside(h,x,y)));}
 const family=facadeSamples[0],modern=facadeSamples[1],villa=facadeSamples[2];
 assert.ok(painted(family,940/1536,330/512));assert.ok(painted(family,750/1536,122/512));assert.ok(painted(family,750/1536,316/512));assert.equal(painted(family,750/1536,160/512),false);assert.equal(painted(family,750/1536,350/512),false);assert.ok(painted(family,1175/1536,350/512));assert.equal(painted(family,1050/1536,360/512),false);assert.ok(painted(family,250/1536,420/512));assert.ok(painted(family,600/1536,335/512));
 assert.ok(painted(modern,575/880,414/738));assert.ok(painted(modern,270/880,490/738));
 assert.ok(painted(villa,790/880,320/584));assert.ok(painted(villa,640/880,300/584));
 assert.equal(painted(family,1050/1536,160/512),false);
 assert.equal(painted(modern,575/880,365/738),false);
 assert.equal(painted(villa,520/880,210/584),false);
 assert.equal(painted(villa,500/880,460/584),false);
});

test("compact family concept preserves glazing and paints four independent surfaces",()=>{
 const sample=facadeSamples.find(s=>s.id==="compact-family");assert.ok(sample);
 assert.equal(new Set(sample.zones.map(z=>z.id)).size,sample.zones.length);
 const all=stylesForTarget({},"all",plain,sample.zones);
 const edited=stylesForTarget(all,"entry",{...plain,colour:"#293f36"},sample.zones);
 assert.equal(edited.entry?.colour,"#293f36");
 assert.equal(edited.left?.colour,plain.colour);
 assert.equal(all.entry?.colour,plain.colour);
});
