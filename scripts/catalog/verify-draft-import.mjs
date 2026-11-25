// Verify only against the disposable CI database; refuse all hosted database addresses.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync,writeFileSync} from "node:fs";
const url=new URL(process.env.DB_URL??"postgresql://invalid.invalid");
assert.ok(["127.0.0.1","localhost"].includes(url.hostname)&&url.port==="54322"&&url.protocol==="postgresql:","Local database only");
const query=sql=>execFileSync("psql",[url.toString(),"-X","-v","ON_ERROR_STOP=1","-At","-c",sql],{encoding:"utf8"}).trim();
const count=()=>JSON.parse(query("select json_build_object('products',(select count(*) from public.products),'variants',(select count(*) from public.product_variants),'inventory',(select count(*) from public.inventory),'prices',(select count(*) from public.pricing_rules),'draftProducts',(select count(*) from public.products where status='draft' and attributes->>'origin'='neerva-static-reference'),'draftVariants',(select count(*) from public.product_variants where status='draft' and sku like 'NEERVA-REF-%'))"));
const summary=JSON.parse(readFileSync("catalog-sync/summary.json","utf8"));
const before=count();
assert.equal(before.products,0,"Expected fresh disposable catalog");
assert.equal(before.variants,0,"Expected fresh disposable variants");
for(let attempt=0;attempt<2;attempt++){
 execFileSync("psql",[url.toString(),"-X","-v","ON_ERROR_STOP=1","-f","catalog-sync/draft-import.sql"],{stdio:"pipe"});
 const current=count();
 assert.equal(current.products,summary.referenceRows);
 assert.equal(current.variants,summary.referenceRows);
 assert.equal(current.draftProducts,summary.referenceRows);
 assert.equal(current.draftVariants,summary.referenceRows);
 assert.equal(current.inventory,before.inventory);
 assert.equal(current.prices,before.prices);
}
writeFileSync("catalog-sync/summary.json",JSON.stringify({...summary,verification:"passed",repeatedImports:2,counts:count()},null,2)+"\n");
console.log("Draft catalog import and idempotency verified",summary.referenceRows);
