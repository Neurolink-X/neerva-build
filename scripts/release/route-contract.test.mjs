import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readdirSync,readFileSync} from "node:fs";
import {join,relative,dirname,resolve,sep} from "node:path";

const app=resolve("src/app"),components=resolve("src/components"),publicDir=resolve("public");
function files(root){
 const all=[];
 for(const entry of readdirSync(root,{withFileTypes:true})){
  const full=join(root,entry.name);
  if(entry.isDirectory())all.push(...files(full));
  else if(entry.isFile())all.push(full);
 }
 return all;
}
const pageFiles=files(app).filter(f=>f.endsWith(sep+"page.tsx"));
const apiFiles=files(join(app,"api")).filter(f=>f.endsWith(sep+"route.ts"));
const sourceFiles=[...files(app),...files(components)].filter(f=>/\.(tsx?|mjs|jsx?)$/.test(f));
function pathnameFor(file){
 const dir=relative(app,dirname(file)).split(sep).filter(segment=>!segment.startsWith("("));
 const path="/"+dir.join("/");
 return path==="/api"?"":path.replace(/\/$/,"")||"/";
}
const pages=new Set(pageFiles.map(pathnameFor));
const api=new Map(apiFiles.map(f=>[pathnameFor(f),f]));
function isDynamicMatch(route,target){
 const expr=route.split("/").map(segment=>{
  if(/^\[\[\.\.\.[^\]]+\]\]$/.test(segment))return ".*";
  if(/^\[\.\.\.[^\]]+\]$/.test(segment))return ".+";
  if(/^\[[^\]]+\]$/.test(segment))return "[^/]+";
  return segment.replace(/[.*+?^$()|[\]{}\\]/g,"\\$&");
 }).join("/");
 return new RegExp("^"+expr+"/?$").test(target);
}
function isKnownPage(target){
 if(pages.has(target)||target==="/")return true;
 if([...pages].some(route=>route.includes("[")&&isDynamicMatch(route,target)))return true;
 const asset=join(publicDir,target.replace(/^\/+/,""));
 return existsSync(asset)||/^(?:\/(?:icon|apple-icon|opengraph-image|robots\.txt|sitemap\.xml|manifest\.webmanifest))$/.test(target);
}
function normalize(path){
 if(!path.startsWith("/")||path.startsWith("//"))return null;
 try{return decodeURIComponent(path.split(/[?#]/,1)[0]).replace(/\/+$/,"")||"/";}
 catch{return null;}
}
const manifest={
 "/api/admin/account-recovery":["POST"],
 "/api/admin/dealer-members":["GET","POST"],
 "/api/dealer/overview":["GET"],
 "/api/admin/audit":["GET"],
 "/api/admin/catalog/campaigns":["GET","POST","PATCH"],
 "/api/admin/catalog":["GET","POST","PATCH"],
 "/api/admin/dealers":["GET","PATCH"],
 "/api/admin/overview":["GET"],
 "/api/admin/fulfilment":["GET","PATCH"],
 "/api/admin/orders":["GET","PATCH"],
 "/api/admin/direct-orders":["GET","PATCH"],
 "/api/admin/pricing":["GET","POST","PATCH"],
 "/api/admin/marketplace-fees":["GET","POST"],
 "/api/dealer/pricing":["GET","POST"],
 "/api/customer/dealer-comparison":["GET"],
 "/api/admin/rfqs":["GET","POST"],
 "/api/admin/studio-payments":["GET","PATCH"],
 "/api/admin/studio-settings":["GET","PATCH"],
 "/api/admin/studio-support":["GET","PATCH"],
 "/api/admin/system-incidents":["GET","PATCH"],
 "/api/admin/users":["GET","POST","PATCH"],
 "/api/catalog/offers":["GET"],
 "/api/catalog/prices":["GET"],
 "/api/catalog":["GET"],
 "/api/customer/quotes":["GET"],
 "/api/dealer/inventory":["GET","POST"],
 "/api/dealer/orders":["GET","PATCH"],
 "/api/dealer/quotes":["GET","POST"],
 "/api/orders":["GET","POST","PATCH"],
 "/api/direct-orders":["GET","POST","PATCH"],
 "/api/rfqs":["POST"],
 "/api/studio/city-rules":["GET"],
 "/api/studio/config":["GET"],
 "/api/studio/payments/claim":["POST"],
 "/api/studio/payments":["GET","POST","DELETE"],
 "/api/studio/premium-report":["POST"],
 "/api/studio/projects":["GET","POST"],
 "/api/studio/support":["GET","POST"]
};
const clientRoutes=Object.keys(manifest).sort();
const knownRoutes=[...api.keys()].sort();
test("every API route is accounted for by the role and method contract",()=>{
 assert.deepEqual(knownRoutes,clientRoutes,"Review each added or removed API route; never silently skip its role contract");
 for(const [route,expectedMethods] of Object.entries(manifest)){
  const code=readFileSync(api.get(route),"utf8");
  const actual=new Set([...code.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PATCH|PUT|DELETE)\b/g)].map(m=>m[1]));
  for(const match of code.matchAll(/export\s+const\s+(GET|POST|PATCH|PUT|DELETE)\s*=/g))actual.add(match[1]);
  assert.deepEqual([...actual].sort(),[...expectedMethods].sort(),route+": declared HTTP methods differ");
  if(route.startsWith("/api/admin/")){
   assert.match(code,/requireAdmin|has_platform_role/,route+" must verify server-side administrator authorization");
  }else if(route.startsWith("/api/dealer/")){
   assert.match(code,/requireDealer/,route+" must check approved dealer + tenant roles");
  }else if(route.startsWith("/api/customer/")||route==="/api/orders"||route==="/api/direct-orders"||route==="/api/rfqs"||
   /^\/api\/studio\/(?:payments|projects|support|premium-report)(?:\/|$)/.test(route)){
   assert.match(code,/requireAuth/,route+" must authenticate the caller");
  }
 }
});
test("literal internal navigation links resolve to existing Next.js page or public asset",()=>{
 const missing=[],checked=new Set();
 // Dynamic href={...} expressions are separately covered by browser-flow tests.
 const href=/\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*["'\x60]([^"'\x60]+)["'\x60]\s*\})/g;
 for(const file of sourceFiles){
  const content=readFileSync(file,"utf8");
  for(const match of content.matchAll(href)){
   const raw=match[1]??match[2]??match[3];
   const path=normalize(raw);
   if(path===null)continue;
   checked.add(path);
   if(!isKnownPage(path)&&!api.has(path))missing.push(relative(resolve("."),file)+" → "+path);
  }
 }
 assert.ok(checked.size>25,"Too few literal internal links scanned; scanner may have stopped recognizing JSX");
 assert.deepEqual(missing,[],"Broken internal navigation destination(s)");
});
test("literal client fetch URL targets resolve to declared API routes",()=>{
 const invalid=[],checked=new Set();
 const pattern=/\bfetch\s*\(\s*["'\x60](\/api\/[^"'\x60]+)["'\x60]/g;
 for(const file of sourceFiles){
  const content=readFileSync(file,"utf8");
  for(const match of content.matchAll(pattern)){
   const path=normalize(match[1]);
   if(path===null)continue;
   checked.add(path);
   if(!api.has(path))invalid.push(relative(resolve("."),file)+" → "+path);
  }
 }
 assert.ok(checked.size>=8,"Too few API consumers scanned");
 assert.deepEqual(invalid,[],"Client requests point to missing API handlers");
});
test("order and paid-access routes never issue backend success without identity checks",()=>{
 for(const route of ["/api/orders","/api/admin/orders","/api/direct-orders","/api/admin/direct-orders","/api/studio/payments","/api/studio/premium-report"]){
  const code=readFileSync(api.get(route),"utf8");
  assert.match(code,/requireAuth|requireAdmin/,route+": identity gate missing");
 }
 const orderApi=readFileSync(api.get("/api/orders"),"utf8");
 assert.match(orderApi,/from\("orders"\)/,"Orders must query real PostgreSQL rows via the customer JWT and RLS");
 assert.match(orderApi,/acceptOfferInput/,"Buyer order POST validates server-trusted offer references");
 assert.doesNotMatch(orderApi,/springOrders|ORDER_SERVICE_URL/,"Live orders must not depend on a missing Java upstream");
 const dealerApi=readFileSync(api.get("/api/dealer/orders"),"utf8");
 assert.match(dealerApi,/in\("tenant_id",auth.tenantIds\)/,"Dealer order responses must be tenant scoped");
 const adminApi=readFileSync(api.get("/api/admin/orders"),"utf8");
 assert.match(adminApi,/requireAdmin/,"Platform order changes require admin identity");
});
