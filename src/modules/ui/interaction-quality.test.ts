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
