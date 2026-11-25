import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
test("card captions are rendered outside the image stage rather than overlaying the photograph",()=>{
 const source=readFileSync("src/components/catalog-material-image.tsx","utf8");
 assert.doesNotMatch(source,/className="catalog-image-note"/);
 assert.match(source,/\<\/div>\s*\{!compact&&<div className="catalog-media-caption"/);
 const published=readFileSync("src/components/published-materials.tsx","utf8");
 assert.match(published,/Product-range photo · exact SKU photo not verified/);
 assert.match(published,/published-catalog-sku/);
});
