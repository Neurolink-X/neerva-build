import test from "node:test";import assert from "node:assert/strict";import {navigationPath,prefetchPath,takePrefetch,allowSpeculativeNetwork,allowStudioWarmup,studioWarmupDelay} from "./intent.ts";
const here="https://example.org/materials";
test("navigation ignores fragments, external links, downloads handled by caller, and same URL",()=>{assert.equal(navigationPath("#catalog-results",here),null);assert.equal(navigationPath("/materials",here),null);assert.equal(navigationPath("https://other.org/materials",here),null);assert.equal(navigationPath("/materials?category=electrical#catalog-results",here),"/materials?category=electrical");assert.equal(prefetchPath("/materials/electrical/example",here),"/materials/electrical/example");for(const path of ["/admin","/account/orders","/checkout","/quotes","/materials?category=electrical","/api/catalog","/design-studio/portfolio","/blog/editorial","/blog/editorial/example"])assert.equal(prefetchPath(path,here),null)});
test("prefetch is deduplicated, bounded and expires",()=>{const recent=new Map<string,number>();for(let i=0;i<6;i++)assert.equal(takePrefetch(recent,"/materials/"+i,100),true);assert.equal(takePrefetch(recent,"/materials/new",100),false);assert.equal(takePrefetch(recent,"/materials/0",100),false);assert.equal(takePrefetch(recent,"/materials/new",60100),true);assert.equal(recent.size,1)});

test("handbook public detail pages can prefetch without private query URLs",()=>{assert.equal(prefetchPath("/build-iq/handbook/ground",here),"/build-iq/handbook/ground");assert.equal(prefetchPath("/build-iq/handbook/ground?draft=1",here),null);assert.equal(prefetchPath("/account?next=/materials",here),null)});

test("background traffic is disabled on slow, unknown, metered or disconnected networks",()=>{const fast={effectiveType:"4g",downlink:8,rtt:50};assert.equal(allowSpeculativeNetwork(fast),true);for(const hint of [undefined,{effectiveType:"slow-2g"},{effectiveType:"2g"},{effectiveType:"3g"},{...fast,saveData:true},{...fast,downlink:.5},{...fast,rtt:450}])assert.equal(allowSpeculativeNetwork(hint),false);assert.equal(allowSpeculativeNetwork(fast,false),false);assert.equal(allowSpeculativeNetwork(fast,true,false),false);assert.equal(prefetchPath("/my-project",here),null);});

test("3D background warming uses a 1 Mbps threshold plus latency and device gates",()=>{
 const fast={effectiveType:"4g",downlink:10,rtt:60},device={cores:8,memory:8};
 assert.equal(allowStudioWarmup(fast,device),true);
 assert.equal(allowStudioWarmup(fast,{cores:8}),true);
 for(const downlink of [1,1.5,2,5])assert.equal(allowStudioWarmup({...fast,downlink},device),true);
 assert.equal(allowStudioWarmup({...fast,effectiveType:"3g",downlink:1,rtt:150},device),true);
 for(const net of [undefined,{...fast,effectiveType:"2g"},{...fast,effectiveType:"3g",rtt:400},{...fast,saveData:true},{...fast,downlink:.5},{...fast,downlink:.999},{...fast,downlink:Infinity},{...fast,rtt:250},{effectiveType:"4g"}])assert.equal(allowStudioWarmup(net,device),false);
 assert.equal(studioWarmupDelay({...fast,downlink:1}),1800);
 assert.equal(studioWarmupDelay({...fast,downlink:1.99}),1800);
 assert.equal(studioWarmupDelay({...fast,downlink:2}),900);
 for(const d of [{},{cores:2,memory:8},{cores:8,memory:2},{cores:NaN,memory:8}])assert.equal(allowStudioWarmup(fast,d),false);
 assert.equal(allowStudioWarmup(fast,device,false,true),false);
 assert.equal(allowStudioWarmup(fast,device,true,false),false);
});
