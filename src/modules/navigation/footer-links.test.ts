import test from "node:test";
import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {footerGroups,footerPolicies} from "./footer-links.ts";
test("footer uses four balanced bilingual groups and unique internal destinations",()=>{
 assert.equal(footerGroups.length,4);
 const links=[...footerGroups.flatMap(g=>[...g.links]),...footerPolicies];
 assert.equal(new Set(links.map(l=>l[0])).size,links.length);
 for(const g of footerGroups){assert.ok(g.links.length>=5&&g.links.length<=6);assert.ok(g.title.every(Boolean));}
 for(const [href,en,hi] of links){
  assert.ok(en.trim()&&hi.trim());
  assert.ok(href.startsWith("/")&&!href.startsWith("//"));
  assert.ok(existsSync("src/app"+href.split("?")[0]+"/page.tsx"),"missing route "+href);
 }
});
test("customer and legal links remain available; internal admin routes stay private",()=>{
 const paths=[...footerGroups.flatMap(g=>[...g.links]),...footerPolicies].map(l=>l[0] as string);
 for(const href of ["/materials","/brands","/quotes","/account/orders","/account/quotes","/support","/privacy","/terms","/returns","/install","/account/dealer"])assert.ok(paths.includes(href),href);
 assert.ok(paths.every(p=>!p.startsWith("/admin")&&!p.startsWith("/api")));
});
