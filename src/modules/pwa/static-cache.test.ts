import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const source=readFileSync(new URL("../../../public/sw.js",import.meta.url),"utf8");
test("static cache only accepts immutable public assets and never transaction requests",()=>{
 const handlers=new Map<string,(event:unknown)=>void>();
 const scope={self:{location:{origin:"https://neerva.in"},addEventListener:(key:string,fn:(event:unknown)=>void)=>handlers.set(key,fn)},URL,Response,Promise};
 runInNewContext(source+"\nself.staticRequest=staticRequest;self.cacheable=cacheable;",scope);
 const policy=scope.self as typeof scope.self&{staticRequest:(r:unknown,u:URL)=>boolean;cacheable:(r:Response)=>boolean};
 const req=(destination:string,headers:Record<string,string>={},method="GET")=>({destination,method,headers:new Headers(headers)});
 const eligible=(p:string,destination:string,headers:Record<string,string>={},method="GET")=>policy.staticRequest(req(destination,headers,method),new URL(p,"https://neerva.in"));
 assert.ok(eligible("/_next/static/chunks/example.js","script"));assert.ok(eligible("/images/catalog/approved/"+"a".repeat(24)+".webp","image"));
 for(const p of ["/api/pricing","/account","/quotes","/checkout","/orders","/my-project","/_next/image?url=/images/x.webp","/images/studio/house-1.webp","https://elsewhere.invalid/_next/static/a.js"])assert.equal(eligible(p,"image"),false,p);
 assert.equal(eligible("/_next/static/a.js","script",{Authorization:"Bearer example"}),false);assert.equal(eligible("/_next/static/a.js","script",{Range:"bytes=0-10"}),false);assert.equal(eligible("/_next/static/a.js","script",{},"POST"),false);
 const good={"cache-control":"public, max-age=31536000, immutable","content-length":"128","content-type":"application/javascript"};
 assert.ok(policy.cacheable(new Response("asset",{headers:good})));
 const invalidHeaders:Record<string,string>[]=[{"cache-control":"private, immutable"},{"cache-control":"public, no-store, immutable"},{"content-length":"9999999"},{"content-length":"0"},{"content-type":"text/html"},{"vary":"Cookie"},{"set-cookie":"test=1"}];
 for(const bad of invalidHeaders)assert.equal(policy.cacheable(new Response("asset",{headers:{...good,...bad}})),false);
 assert.equal(policy.cacheable(new Response("missing",{status:404,headers:good})),false);
 for(const p of ["/api/pricing","/account/orders","/checkout","/quotes","/orders","/my-project"]){let intercepted=false;handlers.get("fetch")!({request:{url:"https://neerva.in"+p,method:"GET",mode:"navigate",destination:"document",headers:new Headers()},respondWith:()=>{intercepted=true}});assert.equal(intercepted,false,p);}
});

test("public query navigation still gets a truthful offline fallback without storing a page",async()=>{
 const handlers=new Map<string,(event:unknown)=>void>();let matched="";let responded:Promise<Response>|undefined;
 const scope={self:{location:{origin:"https://neerva.in"},addEventListener:(key:string,fn:(event:unknown)=>void)=>handlers.set(key,fn)},URL,Response,Promise,fetch:async()=>{throw Error("offline")},caches:{match:async(path:string)=>{matched=path;return new Response("Offline help");}}};
 runInNewContext(source,scope);
 handlers.get("fetch")!({request:{url:"https://neerva.in/materials?category=paint",method:"GET",mode:"navigate",destination:"document",headers:new Headers()},respondWith:(response:Promise<Response>)=>{responded=response}});
 assert.ok(responded);assert.equal(await (await responded).text(),"Offline help");assert.equal(matched,"/offline.html");
});
