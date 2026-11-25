import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const css=readFileSync("src/app/interaction-quality.css","utf8");
test("all routes load shared interaction tokens",()=>{
 assert.match(readFileSync("src/app/layout.tsx","utf8"),/import "\.\/interaction-quality\.css"/);
 assert.match(css,/--action-target:44px/);
 assert.match(css,/touch-action:manipulation/);
});
test("native focus, disabled and busy states remain accessible",()=>{
 assert.match(css,/:focus-visible\{outline:3px/);
 assert.match(css,/:disabled\{cursor:not-allowed/);
 assert.match(css,/\[aria-busy="true"\]\{cursor:progress/);
 assert.doesNotMatch(css,/pointer-events\s*:\s*none/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
});
test("browser quality reports inventory controls and enforce primary touch height",()=>{
 const smoke=readFileSync("scripts/e2e/mobile-smoke.mjs","utf8");
 assert.match(smoke,/interaction-baseline\.json/);
 assert.match(smoke,/primaryTooShort/);
 assert.match(smoke,/unnamed:entries\.filter/);
});

test("future action variants share brand tokens and readable solid-action contrast",()=>{
 const variants=["primary","secondary","accent","quiet","danger"];
 for(const variant of variants)assert.ok(css.includes('data-variant="'+variant+'"'),variant);
 function luminance(hex:string){
  const channels=hex.match(/[a-f0-9]{2}/gi)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
 }
 for(const token of ["primary","primary-hover","accent","accent-hover","danger","danger-hover"]){
  const match=css.match(new RegExp("--action-"+token+":(#[0-9a-f]{6})(?:;|\\s)","i"));
  assert.ok(match,token);assert.ok(1.05/(luminance(match[1])+.05)>=4.5,token+" contrast against white");
 }
 assert.match(css,/data-size="icon"/);
 assert.match(css,/data-size="large"/);
});
