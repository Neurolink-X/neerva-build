import test from "node:test";
import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {demoProducts} from "./marketplace.ts";
import {catalogVisuals} from "./catalog-visuals.ts";
import {directoryCards} from "./brand-pages.ts";
import {catalogCategories} from "./catalog.ts";
import {isLocalCatalogMedia} from "./local-media-policy.ts";
test("reject external and unsafe static media sources",()=>{
 for(const x of ["https://vendor.example/p.webp","//vendor.example/p.webp","/images/catalog/../private.webp","/images/catalog/a.webp?remote=1","/images/catalog/a%2Fb.webp",null])assert.equal(isLocalCatalogMedia(x),false);
 assert.equal(isLocalCatalogMedia("/images/catalog/approved/abc.webp"),true);
});
test("all product galleries and brand preview images use existing local files",()=>{
 for(const p of demoProducts)for(const v of catalogVisuals(p)){assert.ok(isLocalCatalogMedia(v.src),p.slug);assert.ok(existsSync("public"+v.src),v.src);}
 for(const c of catalogCategories)for(const b of directoryCards(c.slug))for(const path of [b.image,b.rangeImage])if(path){assert.ok(isLocalCatalogMedia(path),path);assert.ok(existsSync("public"+path),path);}
});
