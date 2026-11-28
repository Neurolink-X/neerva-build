import test from "node:test";
import assert from "node:assert/strict";
import {signatureWallGallery} from "./signature-wall-gallery.ts";
import {patternGroups} from "./wall-patterns.ts";
test("design-only gallery has eight unique curated compositions and fixed valid palettes",()=>{assert.equal(signatureWallGallery.length,8);assert.equal(new Set(signatureWallGallery.map(d=>d.id)).size,8);assert.equal(new Set(signatureWallGallery.map(d=>d.pattern)).size,8);for(const d of signatureWallGallery){assert.ok(Object.values(patternGroups).flat().includes(d.pattern));assert.match(d.base,/^#[a-f0-9]{6}$/i);assert.match(d.accent,/^#[a-f0-9]{6}$/i);assert.notEqual(d.base as string,d.accent as string);}});
