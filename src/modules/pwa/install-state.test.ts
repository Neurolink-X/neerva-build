import test from "node:test";
import assert from "node:assert/strict";
import {installedDisplayMode,showInstallOffer,INSTALL_OFFER_DELAY_MS} from "./install-state.ts";
test("installed app modes and iOS hide installation offers",()=>{
 for(let i=0;i<3;i++)assert.equal(installedDisplayMode([0,1,2].map(x=>x===i),false),true);
 assert.equal(installedDisplayMode([false,false,false],true),true);
 assert.equal(installedDisplayMode([false,false,false],false),false);
});

test("promotion requires a real install prompt and respects safety gates",()=>{
 const base={ready:true,installed:false,dismissed:false,accepted:false,path:"/",available:true};
 assert.equal(showInstallOffer(base),true);
 for(const state of [{...base,ready:false},{...base,available:false},{...base,installed:true},{...base,dismissed:true},{...base,accepted:true},{...base,path:"/install"},{...base,path:"/install/"}]){
  assert.equal(showInstallOffer(state),false);
 }
});

test("install promotion never obstructs private and transaction workflows",()=>{
 const base={ready:true,installed:false,dismissed:false,accepted:false,path:"/",available:true};
 for(const path of ["/account","/admin/catalog","/dealer/orders","/checkout","/basket","/quotes","/orders","/support","/my-project"])assert.equal(showInstallOffer({...base,path}),false,path);
 for(const path of ["/materials","/design-studio","/family-homes","/design-studio/visualizer"])assert.equal(showInstallOffer({...base,path}),false,path);
 assert.equal(showInstallOffer(base),true);
 assert.ok(INSTALL_OFFER_DELAY_MS>=5000,"no immediate arrival popup");
});
