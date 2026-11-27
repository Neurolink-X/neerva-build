import test from "node:test";
import assert from "node:assert/strict";
import {installedDisplayMode,showInstallOffer,INSTALL_OFFER_DELAY_MS,installEnvironment,installAction,installationGuide} from "./install-state.ts";
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

test("footer never advertises native install without actual prompt",()=>{
 const base={ready:true,runningStandalone:false,installed:false,available:false};
 assert.equal(installAction(base),"guide");
 assert.equal(installAction({...base,available:true}),"native");
 assert.equal(installAction({...base,installed:true}),"help");
 assert.equal(installAction({...base,ready:false}),"hidden");
 assert.equal(installAction({...base,runningStandalone:true,available:true}),"hidden");
});
test("device hints distinguish embedded browsers and OS installation instructions",()=>{
 const cases=[["Mozilla Android; wv Version/4.0 Chrome/120","Linux",1,"android","embedded"],["Mozilla Android Chrome/120 SamsungBrowser/24","Linux",1,"android","samsung"],["Mozilla Android Firefox/120","Linux",1,"android","firefox"],["Mozilla iPhone CriOS/120 Safari/604","iPhone",1,"ios","chromium"],["Mozilla Safari/605","MacIntel",5,"ios","safari"],["Mozilla Windows Chrome/120 Edg/120","Win32",0,"desktop","edge"],["Mozilla Macintosh Safari/605","MacIntel",0,"desktop","safari"]] as const;
 for(const [ua,platform,touches,device,browser] of cases){assert.deepEqual(installEnvironment(ua,platform,touches),{platform:device,browser});assert.ok(installationGuide(device,browser).steps.length>=3);}
 assert.match(installationGuide("android","embedded").steps.join(" "),/copy/i);
 assert.match(installationGuide("ios","safari").steps.join(" "),/Add to Home Screen/);
 assert.match(installationGuide("desktop","safari").steps.join(" "),/Add to Dock/);
});
