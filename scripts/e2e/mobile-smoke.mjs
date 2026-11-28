/* Minimal mobile browser gate: no external telemetry, no credentials, no fake metrics. */
import {chromium} from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {verifyColourStudio} from "./wall-art-regression.mjs";
import {assessPerformance,resourceSummary} from "./performance-budget.mjs";
import {verifyInvalidPhotoUpload} from "./photo-upload-regression.mjs";
const base=process.env.SMOKE_BASE_URL||"http://127.0.0.1:3000";
const views=[{w:360,h:800},{w:390,h:844},{w:430,h:932},{w:768,h:1024},{w:1440,h:900}];
const routes=["/","/room-lab","/build-iq","/inspiration","/design-studio","/design-studio/library","/design-studio/fit","/design-studio/visualizer","/design-studio/workbench","/design-studio/road-planner","/design-studio/portfolio","/design-studio/buildings","/materials","/checkout","/account/orders","/basket","/quotes","/learn/property-guide","/learn/future-homes","/install","/account","/account/addresses","/account/dealer","/terms","/returns","/studio-pricing","/learn","/admin","/admin/orders","/admin/rfqs","/admin/fulfilment","/admin/catalog","/admin/pricing","/admin/marketing","/admin/dealers","/admin/studio-settings","/admin/studio-payments","/admin/studio","/admin/users","/admin/system-health","/admin/audit","/admin/account-recovery","/dealer/dashboard","/dealer/inventory","/dealer/quotes","/dealer/orders"];
async function main(){
 fs.mkdirSync("test-results/mobile",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
 const failures=[],accessibilityReports=[],performanceReports=[],interactionReports=[],architectureReports=[];
 try{
  // Verify SSR output directly: adjacent text separators inside SVG titles can
  // be parsed differently by the browser and cause a production hydration error.
  const noJs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  try{
   const page=await noJs.newPage();
   for(const [route,selector] of [["/design-studio/buildings",".purpose-studio svg title"],["/design-studio/fit",".nroad-diagram svg title"]]){
    const response=await page.goto(base+route,{waitUntil:"domcontentloaded"});
    assert.equal(response?.status(),200);
    const titles=page.locator(selector);
    assert.ok(await titles.count()>0,route+" plan geometry must be present in server HTML");
    const malformed=await titles.evaluateAll(nodes=>nodes.filter(n=>n.childNodes.length!==1||n.firstChild?.nodeType!==3||!n.textContent?.trim()).map(n=>n.outerHTML.slice(0,300)));
    assert.deepEqual(malformed,[],route+" SSR SVG titles must contain exactly one nonempty text node");
   }
  }finally{await noJs.close()}
  // Exercise every commercial purpose.
  for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
   const ctx=await browser.newContext({viewport});
   try{
    const page=await ctx.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
    const response=await page.goto(base+"/design-studio/buildings",{waitUntil:"domcontentloaded"});assert.equal(response?.status(),200);
    const studio=page.locator(".purpose-studio");
    await studio.getByRole("button",{name:"Purpose-led layout",exact:true}).waitFor();
    if(await studio.getByRole("button",{name:"Show 3D concept",exact:true}).count())await studio.getByRole("button",{name:"Show 3D concept",exact:true}).click();
    const lightweight=studio.getByRole("button",{name:"Lightweight 3D",exact:true});if(await lightweight.count())await lightweight.click();
    await studio.getByLabel("Building purpose").selectOption("school");
    await studio.getByRole("img",{name:/Purpose-specific zoning/}).waitFor({state:"detached"});
    for(const purpose of ["mall","school","restaurant","shops","rental"]){
     await studio.getByLabel("Building purpose").selectOption(purpose);
     await studio.getByRole("button",{name:/Load example inputs/}).click();
     await studio.getByRole("button",{name:/Generate distinct concepts/}).click();
     const plan=studio.getByRole("img",{name:/Purpose-specific zoning/});
     await plan.waitFor({state:"visible"});
     const planId=await plan.getAttribute("data-plan-id");
     assert.ok(planId?.startsWith(purpose+"-"),purpose+" selected geometry");
     const massing=studio.locator(".purpose-views svg").nth(1);
     assert.equal(await massing.getAttribute("data-plan-id"),planId);
     assert.ok(await studio.locator(".purpose-views svg").nth(1).locator("polygon").count()>0,"3D view has actual geometry");
     if(viewport.width===390){
      const prefix="390-commercial-"+purpose,front=studio.locator(".purpose-front svg");
      await plan.screenshot({path:path.join("test-results/mobile",prefix+"-2d.png"),animations:"disabled"});
      await front.screenshot({path:path.join("test-results/mobile",prefix+"-elevation.png"),animations:"disabled"});
      const capable=await page.evaluate(()=>{const gl=document.createElement("canvas").getContext("webgl2");if(!gl)return false;gl.getExtension("WEBGL_lose_context")?.loseContext();return true;});
      await studio.getByRole("button",{name:"Interactive 3D",exact:true}).click();
      const capture=async(mode)=>{
       const canvas=studio.locator(".purpose-views [data-room-viewer] canvas"),start=Date.now();
       try{
        await canvas.waitFor({state:"visible",timeout:8000});
        await page.waitForFunction(()=>Number(document.querySelector(".purpose-views [data-scene-boxes]")?.getAttribute("data-scene-boxes"))>0,{},{timeout:8000});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const info=await canvas.evaluate(el=>({width:el.width,height:el.height,boxes:Number(el.parentElement.dataset.sceneBoxes),tier:el.parentElement.dataset.renderTier}));
        assert.ok(info.width>0&&info.height>0&&info.boxes>0);
        const viewer=studio.locator(".purpose-views [data-room-viewer]");assert.equal(await viewer.getAttribute("data-plan-id"),planId);assert.equal(await viewer.getAttribute("data-floor"),mode==="exterior"?"all":await plan.getAttribute("data-floor"));
        await canvas.screenshot({path:path.join("test-results/mobile",prefix+"-"+mode+".png"),animations:"disabled"});
        architectureReports.push({purpose,mode,renderer:"webgl",planId,elapsedMs:Date.now()-start,...info});
        return true;
       }catch(error){
        architectureReports.push({purpose,mode,renderer:"not-verified",planId,webgl2Available:capable,reason:String(error).slice(0,220)});
        if(capable&&purpose==="shops"&&mode==="cutaway")failures.push("Commercial shops: capable browser did not produce a verifiable WebGL scene");
        return false;
       }
      };
      if(await capture("cutaway")){
       if(purpose==="shops"){const tools=studio.locator(".purpose-view-tools");if(await tools.getAttribute("open")===null)await tools.locator("summary").click();await studio.getByRole("button",{name:"Show 3D furniture",exact:true}).click();assert.equal(await studio.locator(".purpose-views [data-room-viewer]").getAttribute("data-plan-id"),planId);await studio.getByRole("button",{name:"Hide 3D furniture",exact:true}).click();}
       await studio.getByRole("button",{name:"Show all floors",exact:true}).click();
       await capture("exterior");
       await studio.getByRole("button",{name:"Show selected floor",exact:true}).click();
      }
      const lightweight=studio.getByRole("button",{name:"Lightweight 3D",exact:true});
      if(await lightweight.count())await lightweight.click();
      await massing.waitFor({state:"visible"});
     }
     await studio.getByRole("button",{name:"Lite view · 2D only"}).click();
     assert.equal(await studio.locator(".purpose-views svg").count(),1,"lite mode preserves only the selected 2D plan");
     await studio.getByRole("button",{name:"Show 3D concept"}).click();
     assert.equal(await studio.locator(".purpose-views svg").nth(1).getAttribute("data-plan-id"),await plan.getAttribute("data-plan-id"));
     const choices=studio.getByRole("group",{name:"Choose zoning option"}).getByRole("button");
     assert.ok(await choices.count()>0);
     if(await choices.count()>1){await choices.nth(1).click();assert.notEqual(await plan.getAttribute("data-plan-id"),planId);assert.equal(await plan.getAttribute("data-plan-id"),await massing.getAttribute("data-plan-id"));}
     const floors=studio.getByRole("group",{name:"Floor selection"}).getByRole("button");
     if(await floors.count()>1){await floors.nth(1).click();assert.equal(await plan.getAttribute("data-floor"),"1");assert.equal(await massing.getAttribute("data-floor"),"1");}
     assert.ok(await studio.evaluate(e=>e.scrollWidth<=e.clientWidth+2),purpose+" studio overflow");
    }
    const irregular=studio.locator("details").filter({has:page.getByText("Irregular plot feasibility",{exact:true})}).first();
    await irregular.locator("summary").click();
    await irregular.getByRole("button",{name:"L-shaped example"}).click();
    await irregular.getByRole("button",{name:"Analyze boundary"}).click();
    assert.ok(await irregular.getByRole("img",{name:"Measured polygon and candidate rectangular envelope"}).isVisible());
    await irregular.getByRole("button",{name:"Use envelope dimensions in planner"}).click();
    assert.ok(await studio.getByLabel("Frontage (ft)").inputValue());
    // Scope to the quantity worksheet.
    const summary=studio.getByText("Commercial building quantity worksheet",{exact:true});
    await summary.click();
    const panel=summary.locator("..");
    assert.equal(await panel.locator("p").filter({hasText:/^Selected floor area:/}).count(),1);
    assert.ok(await panel.locator("p").filter({hasText:/^Selected floor area:/}).isVisible());
    const anonymous=await page.request.get(base+"/api/studio/commercial-projects");
    assert.ok([401,503].includes(anonymous.status()),"anonymous commercial projects must not be disclosed");
    assert.deepEqual(errors,[],"commercial studio hydration and browser errors at "+viewport.width+"px");
    await page.goto(base+"/build-iq",{waitUntil:"domcontentloaded"});
    assert.equal(await page.locator("#practical-start article").count(),6,"practical site knowledge is prominent");
    assert.equal(await page.locator("#practical-start .learning-photo img[loading=lazy]").count(),3,"three lightweight material references");
   }finally{await ctx.close()}
  }
  const liteContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"block"});
  try{
   await liteContext.addInitScript(()=>{const conn=new EventTarget();Object.assign(conn,{effectiveType:"3g",saveData:true,downlink:.5,rtt:400});Object.defineProperty(navigator,"connection",{value:conn,configurable:true});});
   const page=await liteContext.newPage();await page.goto(base+"/design-studio/buildings",{waitUntil:"domcontentloaded"});
   const studio=page.locator(".purpose-studio");
   await studio.getByRole("button",{name:"Show 3D concept",exact:true}).waitFor();
   assert.equal(await studio.locator(".purpose-views svg").count(),1);
   assert.equal(await studio.locator("[data-room-viewer] canvas").count(),0,"automatic lite mode does not mount WebGL");
   await studio.getByRole("button",{name:"Show 3D concept",exact:true}).click();
   assert.equal(await studio.locator(".purpose-views svg").count(),2,"explicit user preference overrides lite hint");
   await studio.getByRole("button",{name:"Classic access spine",exact:true}).click();
   assert.ok(!(await studio.locator(".purpose-views svg").first().getAttribute("data-plan-id")).endsWith("-purpose-v2"));
   // A small plot may not support side-gallery; provide a larger explicit brief.
   await studio.getByLabel("Frontage (ft)").fill("180");
   await studio.getByLabel("Depth (ft)",{exact:true}).fill("240");
   await studio.getByRole("button",{name:/Generate distinct concepts/}).click();
   await studio.getByRole("button",{name:"Side gallery",exact:true}).click();
   const galleryPlan=studio.getByRole("img",{name:/Purpose-specific zoning/});
   await galleryPlan.waitFor({state:"visible"});
   assert.match(await galleryPlan.getAttribute("data-plan-id"),/-gallery-v1$/);
   await studio.getByRole("button",{name:"Compare recommended designs",exact:true}).click();
   const comparison=studio.getByRole("region",{name:"Recommended concept comparison"});await comparison.waitFor();
   const options=comparison.getByRole("button");assert.ok(await options.count()>0&&await options.count()<=24);
   await options.first().click();
   assert.equal(await galleryPlan.getAttribute("data-plan-id"),await studio.locator(".purpose-views svg").nth(1).getAttribute("data-plan-id"));
   assert.equal(await studio.locator(".purpose-views svg").nth(1).getAttribute("data-plan-id"),await galleryPlan.getAttribute("data-plan-id"));
   await studio.getByLabel("Building purpose").selectOption("rental");
   await studio.getByRole("button",{name:/Load example inputs for Rental property/}).click();
   await studio.getByRole("button",{name:/Generate distinct concepts/}).click();
   await studio.getByRole("button",{name:"Rooms & shared facilities",exact:true}).click();
   const apartment=studio.getByRole("img",{name:/Purpose-specific zoning/});await apartment.waitFor({state:"visible"});
   assert.match(await apartment.getAttribute("data-plan-id"),/-internal-v1-[023]$/);
   assert.equal(await apartment.locator("text").filter({hasText:"Lift reserve"}).count(),0,"stairs-only is the new-project default");
   assert.ok(await apartment.locator("text").filter({hasText:"Stair reserve"}).count()>0);
   await studio.getByLabel("Lift provision",{exact:true}).selectOption("yes");
   await studio.getByRole("button",{name:/Generate distinct concepts/}).click();
   await apartment.locator("text").filter({hasText:"Lift reserve"}).first().waitFor({state:"visible"});
   assert.ok(await apartment.locator("text").filter({hasText:"Bedroom 1"}).count()>0);
   assert.equal(await studio.locator(".purpose-views svg").nth(1).getAttribute("data-plan-id"),await apartment.getAttribute("data-plan-id"));
   await page.goto(base+"/design-studio/road-planner",{waitUntil:"load"});
   const slot=page.locator(".nroad-3d-slot");await slot.scrollIntoViewIfNeeded();
   await slot.getByRole("button",{name:"Load interactive 3D",exact:true}).waitFor({state:"visible"});
   assert.equal(await page.locator(".nbd-building").count(),0,"scrolling on data saver must leave the residential 3D viewer on demand");
   assert.equal(await slot.getAttribute("data-warm-state"),"idle");
   await slot.getByRole("button",{name:"Load interactive 3D",exact:true}).click();
   await page.locator(".nbd-building").waitFor({state:"visible",timeout:30000});
  }finally{await liteContext.close()}
  const lowDevice=await browser.newContext({viewport:{width:360,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:"block"});
  try{
   await lowDevice.addInitScript(()=>{const conn=new EventTarget();Object.assign(conn,{effectiveType:"4g",saveData:false,downlink:10,rtt:60});Object.defineProperty(navigator,"connection",{value:conn,configurable:true});Object.defineProperty(navigator,"deviceMemory",{value:2,configurable:true});Object.defineProperty(navigator,"hardwareConcurrency",{value:2,configurable:true});});
   const page=await lowDevice.newPage(),cdp=await lowDevice.newCDPSession(page);
   await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
   const start=Date.now();await page.goto(base+"/design-studio/buildings",{waitUntil:"domcontentloaded"});
   const studio=page.locator(".purpose-studio");
   await studio.getByRole("button",{name:"Show 3D concept",exact:true}).waitFor();
   assert.equal(await studio.locator(".purpose-views [data-room-viewer] canvas").count(),0,"low-memory device never auto-allocates a commercial GPU scene");
   await studio.getByRole("button",{name:"Show 3D concept",exact:true}).click();
   await studio.locator(".purpose-views svg").nth(1).waitFor({state:"visible"});
   performanceReports.push({route:"/design-studio/buildings",profile:"2GB/2-core hints, 4x CPU slowdown",elapsedMs:Date.now()-start,scope:"simulated Chromium; not real Android"});
  }finally{await lowDevice.close()}
  // Cold and repeat navigation on a constrained connection. Do not confuse
  // simulated local Chromium timings with field Web Vitals.
  for(const profile of [{name:"slow-3g",latency:400,download:400000/8,upload:200000/8},{name:"weak-4g",latency:150,download:1500000/8,upload:750000/8}]){
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:"block"});
   try{await ctx.addInitScript(()=>{const c=new EventTarget();Object.assign(c,{effectiveType:"3g",saveData:true,downlink:.4,rtt:400});Object.defineProperty(navigator,"connection",{value:c,configurable:true});});
    const page=await ctx.newPage(),session=await ctx.newCDPSession(page);await session.send("Network.enable");await session.send("Network.emulateNetworkConditions",{offline:false,latency:profile.latency,downloadThroughput:profile.download,uploadThroughput:profile.upload,connectionType:"cellular3g"});
    let speculative=0;page.on("request",r=>{const h=r.headers();if(h["next-router-prefetch"]||h["purpose"]==="prefetch"||h["sec-purpose"]?.includes("prefetch"))speculative++;});
    for(const visit of ["cold","repeat"]){const started=Date.now();await page.goto(base+"/",{waitUntil:"domcontentloaded",timeout:120000});await page.locator(".nbh-journey.nbh-primary").waitFor({state:"visible",timeout:60000});const usefulMs=Date.now()-started;
     await page.waitForLoadState("load",{timeout:120000});const resources=await page.evaluate(resourceSummary);
     assert.ok(usefulMs<60000,profile.name+" useful homepage exceeded severe smoke ceiling");assert.equal(speculative,0,profile.name+" must not prefetch routes before interaction");performanceReports.push({profile:profile.name,visit,usefulMs,...resources,scope:"simulated constrained network; not production field latency"});
    }
    await page.locator(".nbh-journey.nbh-primary").click({timeout:60000});await page.waitForURL("**/materials",{timeout:120000});assert.equal(new URL(page.url()).pathname,"/materials","real navigation still works with prefetch disabled");
   }finally{await ctx.close()}
  }
  // Additional viewport checks.
  for(const v of [{w:320,h:640},{w:1024,h:768},{w:1920,h:1080}]){
   const ctx=await browser.newContext({viewport:{width:v.w,height:v.h}});
   try{const page=await ctx.newPage();
    for(const route of ["/","/materials","/materials/bricks-blocks","/materials/bricks-blocks/red-clay-brick","/brands","/design-studio","/design-studio/visualizer","/build-iq","/checkout?cart=1"]){
     const response=await page.goto(base+route,{waitUntil:"load",timeout:60000});assert.equal(response?.status(),200,route);
     const result=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),broken:[...document.images].filter(i=>i.complete&&i.getBoundingClientRect().width>0&&!i.naturalWidth).map(i=>i.getAttribute("src"))}));
     if(result.scroll>result.width+2)failures.push(v.w+"px "+route+": responsive overflow "+(result.scroll-result.width)+"px");
     if(result.broken.length)failures.push(v.w+"px "+route+": broken visible images "+JSON.stringify(result.broken));
    }
   }finally{await ctx.close()}
  }
  // Footer geometry across devices and languages.
  for(const v of [{w:320,h:640},{w:360,h:800},{w:390,h:844},{w:430,h:932},{w:667,h:375},{w:768,h:1024},{w:1024,h:768},{w:1440,h:900},{w:1920,h:1080}]){
   const ctx=await browser.newContext({viewport:{width:v.w,height:v.h}});
   try{const page=await ctx.newPage();await page.goto(base+"/",{waitUntil:"load"});
    const footer=page.locator("footer.unified-footer");
    const action=footer.locator(".unified-footer-app > .unified-footer-app-link");
    async function verifyFooter(lang,variant){
     if(await footer.getAttribute("lang")!==lang)await page.locator(".nbh-language").click();
     await action.waitFor({state:"visible"});
     assert.equal(await action.count(),1,"exactly one app action");
     assert.equal(await footer.getAttribute("lang"),lang,"footer language matches selected home language");
     const metrics=await footer.evaluate(el=>{
      const frame=el.getBoundingClientRect(),action=el.querySelector(".unified-footer-app > .unified-footer-app-link"),copy=el.querySelector(".unified-footer-app-copy"),icon=action.querySelector("svg"),b=action.getBoundingClientRect(),c=copy.getBoundingClientRect();
      const fits=node=>{const r=node.getBoundingClientRect();return r.left>=frame.left-1&&r.right<=frame.right+1&&node.scrollWidth<=node.clientWidth+2};
      return {tag:action.tagName,href:action.getAttribute("href"),fits:[...el.querySelectorAll(".unified-footer-groups nav,.unified-footer-actions a,.unified-footer-legal a,.unified-footer-app-copy,.unified-footer-app > .unified-footer-app-link")].every(fits),iconFits:action.tagName==="BUTTON"?!!icon&&icon.getBoundingClientRect().width>=20:true,actionHeight:b.height,overlap:Math.min(b.right,c.right)-Math.max(b.left,c.left)>1&&Math.min(b.bottom,c.bottom)-Math.max(b.top,c.top)>1,links:el.querySelectorAll(".unified-footer-groups a").length,overflow:el.scrollWidth>el.clientWidth+2,stacked:b.top>=c.bottom-1};
     });
     assert.ok(metrics.fits&&metrics.iconFits&&!metrics.overlap&&!metrics.overflow&&metrics.actionHeight>=43,`${v.w}px ${lang} ${variant} footer fit: ${JSON.stringify(metrics)}`);
     assert.equal(metrics.links,22,"all footer navigation links remain");
     if(variant==="native")assert.equal(metrics.tag,"BUTTON","captured native event must expose direct installation");
     else if(metrics.tag==="A")assert.equal(metrics.href,"/install","fallback opens setup guide");
     else assert.equal(metrics.tag,"BUTTON","browser may already expose a real installation event");
     if(v.w<=340)assert.ok(metrics.stacked,"narrow screen app action stacks under copy");
     await footer.screenshot({path:path.join("test-results/mobile",`${v.w}-${lang}-${variant}-footer-responsive.png`),animations:"disabled"});
    }
    for(const lang of ["en","hi"])await verifyFooter(lang,"default");
    await page.evaluate(()=>{const event=new Event("beforeinstallprompt",{cancelable:true});Object.assign(event,{prompt:async()=>undefined,userChoice:Promise.resolve({outcome:"dismissed"})});window.dispatchEvent(event);});
    await footer.locator(".unified-footer-app > button").waitFor({state:"visible"});
    for(const lang of ["en","hi"])await verifyFooter(lang,"native");
   }finally{await ctx.close()}
  }
  // Paint catalogue stays readable and bounded on phones and desktop.
  for(const v of [{w:320,h:640},{w:390,h:844},{w:768,h:1024},{w:1440,h:900}]){
   const ctx=await browser.newContext({viewport:{width:v.w,height:v.h}});
   try{const page=await ctx.newPage();await page.goto(base+"/materials/paint",{waitUntil:"load"});const showroom=page.locator(".paint-showroom");
    assert.ok(await showroom.isVisible());assert.ok(await showroom.locator(".tile-show-card").count()<=8);
    assert.ok(await showroom.evaluate(e=>e.scrollWidth<=e.clientWidth+2));assert.equal(await showroom.locator(".paint-showroom-journey a").count(),3);
    const next=showroom.getByRole("button",{name:"Next →",exact:true});if(await next.count()){await next.click();assert.match(await showroom.locator(".paint-page-nav").innerText(),/Page 2 of/);}
    await showroom.getByRole("button",{name:"Reset filters"}).click();assert.ok(await showroom.locator(".tile-show-card").count()<=8);
    assert.ok(await showroom.locator("#paint-estimate").isVisible());
   }finally{await ctx.close()}
  }
  // Audit other image-heavy public pages on a constrained network. The
  // normal workflow retains its existing route and pixel regression checks.
  for(const route of ["/materials","/brands","/materials/tiles","/materials/hardware","/design-studio/portfolio?width=18&depth=50&floors=2&road=N&bedrooms=3&parking=true"]){
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:"block"});
   try{await ctx.addInitScript(()=>{const c=new EventTarget();Object.assign(c,{effectiveType:"3g",saveData:true,downlink:.4,rtt:400});Object.defineProperty(navigator,"connection",{value:c,configurable:true});});
    const page=await ctx.newPage(),cdp=await ctx.newCDPSession(page);await cdp.send("Network.enable");await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:150,downloadThroughput:1500000/8,uploadThroughput:750000/8,connectionType:"cellular4g"});
    let prefetch=0;page.on("request",r=>{const h=r.headers();if(h["next-router-prefetch"]||h["purpose"]==="prefetch"||h["sec-purpose"]?.includes("prefetch"))prefetch++;});
    const started=Date.now();await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:120000});
    const main=route.includes("/portfolio?")?".nroad-form":route==="/brands"?".br-filters":route==="/materials"?".catalog-toolbar":".tile-showroom";
    await page.locator(main).first().waitFor({state:"visible",timeout:90000});const usefulMs=Date.now()-started;
    await page.waitForLoadState("load",{timeout:120000});
    const resources=await page.evaluate(resourceSummary);
    assert.ok(usefulMs<90000,route+" initial useful content exceeded severe test ceiling");
    if(route.includes("/portfolio?"))assert.equal(await page.locator(".nbd-building").count(),0,"slow link must not eagerly initialize 3D");
    performanceReports.push({route,profile:"weak-4g",usefulMs,prefetch,...resources,scope:"simulated local Chromium; not field Web Vitals"});
   }finally{await ctx.close()}
  }
  // Verify real chunk preparation without creating an offscreen WebGL viewer.
  for(const profile of [{name:"capable-fast",downlink:12,rtt:60,saveData:false,memory:8,warm:true},{name:"controlled-1mbps",downlink:1,rtt:120,saveData:false,memory:4,warm:true},{name:"slow-500kbps",downlink:.5,rtt:120,saveData:false,memory:8,warm:false},{name:"data-saver",downlink:12,rtt:60,saveData:true,memory:8,warm:false},{name:"low-memory",downlink:12,rtt:60,saveData:false,memory:2,warm:false},{name:"low-cpu",downlink:12,rtt:60,saveData:false,memory:8,cores:2,warm:false}]){
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:"block"});
   try{await ctx.addInitScript(p=>{const c=new EventTarget();Object.assign(c,{effectiveType:"4g",downlink:p.downlink,rtt:p.rtt,saveData:p.saveData});Object.defineProperty(navigator,"connection",{value:c,configurable:true});Object.defineProperty(navigator,"hardwareConcurrency",{value:p.cores??8,configurable:true});Object.defineProperty(navigator,"deviceMemory",{value:p.memory,configurable:true});},profile);
    const page=await ctx.newPage();await page.goto(base+"/design-studio/portfolio?width=18&depth=50&floors=2&road=N&bedrooms=3&parking=true",{waitUntil:"load"});
    const slot=page.locator(".nroad-3d-slot");await slot.waitFor({state:"attached"});
    if(profile.warm)await page.waitForFunction(()=>document.querySelector(".nroad-3d-slot")?.dataset.warmState==="ready",null,{timeout:20000});
    else {await page.waitForTimeout(2200);assert.equal(await slot.getAttribute("data-warm-state"),"idle",profile.name+" must not warm");}
    assert.equal(await page.locator(".nbd-building").count(),0,profile.name+" must not mount offscreen");
    const requested=Date.now();await slot.scrollIntoViewIfNeeded();
     const onDemand=profile.saveData||profile.downlink<1||profile.memory<=2||(profile.cores??8)<=2;
     if(onDemand){
      const action=slot.getByRole("button",{name:"Load interactive 3D",exact:true});await action.waitFor({state:"visible"});
      await page.waitForTimeout(500);
      assert.equal(await page.locator(".nbd-building").count(),0,profile.name+" scrolling must not mount WebGL");
      await action.click();
     }
    try{await page.getByRole("button",{name:"Selected floor cutaway",exact:true}).waitFor({timeout:30000});}catch(error){throw new Error(profile.name+" failed to open residential 3D after "+(onDemand?"explicit request":"scroll"),{cause:error});}
    assert.equal(await page.locator(".nbd-building").getAttribute("data-plan-id"),await page.locator(".nroad-diagram").getAttribute("data-plan-id"));
    performanceReports.push({profile:profile.name,viewerRequestToControlsMs:Date.now()-requested,scope:"local browser interaction, includes scroll and automation; not field INP"});
   }finally{await ctx.close()}
  }
  // Facade gallery and aspect checks across nine sizes.
  for(const v of [{w:320,h:640},{w:360,h:800},{w:390,h:844},{w:430,h:932},{w:667,h:375},{w:768,h:1024},{w:1024,h:768},{w:1440,h:900},{w:1920,h:1080}]){
   const ctx=await browser.newContext({viewport:{width:v.w,height:v.h}});
   try{const page=await ctx.newPage();await page.goto(base+"/design-studio/visualizer",{waitUntil:"load"});
    assert.equal(await page.getByRole("region",{name:"Commercial colour preview"}).count(),0,"no schematic commercial samples in photo studio");
    assert.equal(await page.getByRole("link",{name:"Building Studio →",exact:true}).count(),1);
    await page.getByRole("button",{name:"Sample house exterior"}).click();
    const gallery=page.locator(".paint-sample-gallery");await gallery.waitFor({state:"visible"});
    assert.equal(await gallery.locator("button").count(),5,"all facade choices remain available");
     assert.equal(await gallery.locator("button").first().getAttribute("data-facade-sample"),"compact-family","broad-wall sample is the first facade");
     assert.equal(await gallery.locator("button").first().getAttribute("aria-pressed"),"true","first facade is selected by default");
    assert.equal(await gallery.locator("button[aria-pressed=true]").count(),1,"selection semantics remain accessible without a visual badge");
    assert.ok(await gallery.evaluate(el=>{const active=el.querySelector("button[aria-pressed=true]"),other=el.querySelector("button[aria-pressed=false]");return active&&other&&getComputedStyle(active).borderColor!==getComputedStyle(other).borderColor}),"active house is visually distinguishable without a badge");
    for(const img of await gallery.locator("img").all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());}
    const geometry=await gallery.evaluate(el=>{const frame=el.getBoundingClientRect();const cards=[...el.querySelectorAll("button")];return {overflow:el.scrollWidth>el.clientWidth+2,columns:new Set(cards.map(b=>Math.round(b.getBoundingClientRect().left))).size,fit:cards.every(b=>{const r=b.getBoundingClientRect(),slot=b.querySelector(".paint-sample-photo").getBoundingClientRect(),img=b.querySelector("img");return r.left>=frame.left-1&&r.right<=frame.right+1&&slot.left>=r.left-1&&slot.right<=r.right+1&&Math.abs(slot.width/slot.height-(b.dataset.facadeSample==="compact-family"?1.5:4/3))<.04&&img.naturalWidth>0&&getComputedStyle(img).objectFit==="contain";})};});
    assert.ok(!geometry.overflow&&geometry.fit&&geometry.columns===(v.w<=1100?2:4),v.w+"px facade gallery: "+JSON.stringify(geometry));
    await page.getByRole("button",{name:/100 gaj family home/}).click();
    assert.match(await page.locator(".paint-sample-feedback").innerText(),/100 gaj family home/);
    await page.waitForFunction(()=>{const c=document.querySelector(".nbd-photo canvas");return c?.dataset.sample==="compact-family"&&!!document.querySelector(".paint-preview-actions button")&&c.getBoundingClientRect().height>0});
    assert.ok(await page.locator(".nbd-photo canvas").evaluate(c=>{const r=c.getBoundingClientRect(),p=c.parentElement.getBoundingClientRect();return Math.abs(r.width/r.height-c.width/c.height)<.025&&r.left>=p.left-1&&r.right<=p.right+1&&p.right<=innerWidth+1}),v.w+"px full facade fits its source aspect ratio");
    if(v.w<=430&&v.h>560){
     await verifyInvalidPhotoUpload(page);
     await page.getByRole("button",{name:"Paint + design",exact:true}).click();
     await page.getByRole("button",{name:"Modern",exact:true}).click();
     assert.equal(await page.getByRole("button",{name:"3D effects",exact:true}).count(),0);
     const pattern=page.getByRole("button",{name:"Vertical accent pier",exact:true});
     await pattern.evaluate(e=>e.scrollIntoView({block:"end",behavior:"instant"}));
     await pattern.click();
     assert.equal(await pattern.getAttribute("aria-pressed"),"true","pattern selection remains functional without a sticky cropped preview");
     await pattern.locator("svg polyline").first().waitFor({state:"attached"});assert.ok(await pattern.locator("svg polyline").count()>1,"painting swatch has actual procedural motif geometry");
     const intensity=page.getByLabel(/Design intensity/);await intensity.fill("0.45");assert.ok(Number(await pattern.locator("svg g").getAttribute("opacity"))<=.45,"painting swatch intensity follows the wall control");await intensity.press("End");assert.equal(await intensity.inputValue(),"1","keyboard reaches maximum intensity");await intensity.press("ArrowLeft");assert.equal(await intensity.inputValue(),"0.95","keyboard follows the declared step");
     await page.getByRole("button",{name:"Geometry",exact:true}).click();const geo=page.getByRole("button",{name:"Horizontal elevation bands",exact:true});await geo.click();assert.equal(await geo.getAttribute("aria-pressed"),"true");
     const canvas=page.locator(".nbd-photo canvas");await canvas.scrollIntoViewIfNeeded();
     assert.ok(await canvas.evaluate(c=>{const r=c.getBoundingClientRect();return r.height>0&&Math.abs(r.width/r.height-c.width/c.height)<.025}),"full canvas retains original aspect ratio after changing pattern");
    }
    await gallery.screenshot({path:path.join("test-results/mobile",v.w+"-facade-gallery.png"),animations:"disabled"});
   }finally{await ctx.close()}
  }
  for(const v of views){
   const ctx=await browser.newContext({viewport:{width:v.w,height:v.h},deviceScaleFactor:v.w<=430?2:1,isMobile:v.w<=430,hasTouch:v.w<=768});
   const page=await ctx.newPage(),errors=[];
   if(v.w===390)await page.addInitScript(()=>{
    const metrics={lcp:null,cls:0,sessionStart:0,previousShift:0,sessionScore:0};
    window.__neervaPerf=metrics;
    window.__neervaObservedVitals=[];
    window.__neervaInteractionDurations={};
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.interactionId)window.__neervaInteractionDurations[e.interactionId]=Math.max(window.__neervaInteractionDurations[e.interactionId]??0,e.duration);}).observe({type:"event",buffered:true,durationThreshold:16});}catch{}
    window.addEventListener("neerva:web-vitals",event=>{if(Array.isArray(event.detail))window.__neervaObservedVitals=event.detail.filter(x=>["LCP","INP","CLS"].includes(x.name)&&Number.isFinite(x.value)&&x.value>=0);});
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())metrics.lcp=e.startTime;}).observe({type:"largest-contentful-paint",buffered:true});}catch{}
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput){if(e.startTime-metrics.previousShift>1000||e.startTime-metrics.sessionStart>5000){metrics.sessionStart=e.startTime;metrics.sessionScore=0;}metrics.previousShift=e.startTime;metrics.sessionScore+=e.value;metrics.cls=Math.max(metrics.cls,metrics.sessionScore);}}).observe({type:"layout-shift",buffered:true});}catch{}
   });
   page.on("pageerror",error=>errors.push("uncaught at "+new URL(page.url()).pathname+": "+error.message));
   page.on("console",message=>{if(message.type()==="error")errors.push("console at "+new URL(page.url()).pathname+": "+message.text().slice(0,180))});
   for(const route of routes){
    const res=await page.goto(base+route,{waitUntil:"load",timeout:60000});
    assert.equal(res?.status(),200,"HTTP "+route+" at "+v.w+"px");
    const issues=await page.evaluate(()=>{
     const root=document.documentElement,body=document.body;
     const contentWidth=Math.max(root.scrollWidth,body.scrollWidth);
     return{width:root.clientWidth,contentWidth,h1:document.querySelectorAll("h1").length,title:document.title,lang:root.lang};
    });
    if(issues.contentWidth>issues.width+2)failures.push(v.w+"px "+route+": horizontal overflow "+(issues.contentWidth-issues.width)+"px");
    if(!issues.title)failures.push(v.w+"px "+route+": missing document title");
    if(!issues.lang)failures.push(v.w+"px "+route+": missing document language");
    if(issues.h1<1)failures.push(v.w+"px "+route+": missing main heading");
    // Inspect targets without destructive or authenticated actions.
    const interaction=await page.evaluate(()=>{
     const elements=[...document.querySelectorAll('a[href],button,summary,input[type="submit"],input[type="button"],[role="button"]')].filter(el=>{
      const rect=el.getBoundingClientRect(),style=getComputedStyle(el);return rect.width>0&&rect.height>0&&style.visibility!=="hidden"&&style.display!=="none"&&!el.closest("[inert],[aria-hidden=true]");
     });
     const entries=elements.map(el=>{
      const rect=el.getBoundingClientRect(),labelledBy=(el.getAttribute("aria-labelledby")??"").split(/\s+/).filter(Boolean).map(id=>document.getElementById(id)?.textContent??"").join(" ");
      const label=(el.getAttribute("aria-label")||labelledBy||el.textContent||el.getAttribute("value")||el.querySelector("img[alt]")?.getAttribute("alt")||el.getAttribute("title")||"").trim().slice(0,100);
      return {tag:el.tagName.toLowerCase(),label,href:el.getAttribute("href"),width:Math.round(rect.width),height:Math.round(rect.height),disabled:el.matches(":disabled,[aria-disabled=true]"),primary:el.matches(".button,.header-install,.nbh-outline-link,.nbh-studio-generate")};
     });
     return {total:entries.length,unnamed:entries.filter(x=>!x.label),small:entries.filter(x=>!x.disabled&&(x.width<44||x.height<44)),primaryTooShort:entries.filter(x=>x.primary&&!x.disabled&&x.height<43)};
    });
    interactionReports.push({route,width:v.w,total:interaction.total,unnamed:interaction.unnamed,smallCount:interaction.small.length,small:interaction.small.slice(0,25),primaryTooShort:interaction.primaryTooShort});
    if(interaction.primaryTooShort.length)failures.push(v.w+"px "+route+": primary action height below 44px "+JSON.stringify(interaction.primaryTooShort));
    if(v.w===390&&["/","/materials","/design-studio","/design-studio/fit","/design-studio/visualizer","/room-lab","/build-iq","/inspiration","/checkout","/account/orders","/design-studio/buildings","/design-studio/road-planner","/design-studio/portfolio","/quotes","/learn"].includes(route)){
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     const timing=await page.evaluate(()=>{const n=performance.getEntriesByType("navigation")[0],m=window.__neervaPerf;return {ttfbMs:n?Math.round(n.responseStart):null,loadMs:n?Math.round(n.loadEventEnd):null,lcpMs:m?.lcp==null?null:Math.round(m.lcp),cls:m?.cls??null};});
     const budget=assessPerformance(timing);
     performanceReports.push({route,width:v.w,...timing,budget,scope:"initial load observation, not field Web Vitals"});
     for(const issue of budget.failures)failures.push("Severe local performance regression "+route+": "+issue);
     if(route==="/materials"||route==="/build-iq"){
      const search=route==="/materials"?page.locator(".catalog-toolbar input[type=search]"):page.locator(".academy-discovery input[type=search]");
      await search.click();await search.pressSequentially("cement",{delay:30});await search.press("Control+a");await search.press("Backspace");await page.waitForTimeout(300);
      const interaction=await page.evaluate(()=>{const values=Object.values(window.__neervaInteractionDurations??{});return {count:values.length,maxInteractionMs:values.length?Math.max(...values):null}});
      performanceReports.push({route,width:v.w,...interaction,scope:"observed Event Timing interactions; not field INP"});
     }
    }
    if(v.w===390&&["/","/account","/quotes","/materials","/design-studio/fit"].includes(route)){
      try{
        const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
        accessibilityReports.push({
          route,width:v.w,passes:result.passes.length,incomplete:result.incomplete.length,
          violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,
            helpUrl:v.helpUrl,nodes:v.nodes.slice(0,5).map(node=>({target:node.target,summary:node.failureSummary}))}))
        });
      }catch(error){accessibilityReports.push({route,width:v.w,error:String(error)});}
    }
    if(v.w===360||v.w===430)await page.screenshot({path:path.join("test-results/mobile",v.w+"-"+(route.replaceAll("/","-")||"home")+".png"),fullPage:true,animations:"disabled"});
   }
   if(v.w===390){
    await page.goto(base+"/",{waitUntil:"load"});
    const indicator=page.locator(".neerva-navigation-feedback");
    await indicator.waitFor({state:"attached"});
    await page.evaluate(()=>{window.__neervaClickFeedback=null;document.addEventListener("click",event=>{if(event.target instanceof Element&&event.target.closest(".nbh-journey.nbh-primary"))window.__neervaClickFeedback={active:document.querySelector(".neerva-navigation-feedback")?.getAttribute("data-active")==="true",at:performance.now()}},{capture:true,once:true})});
    await page.locator(".nbh-journey.nbh-primary").click();
    await page.waitForURL("**/materials");
    await page.locator(".catalog-discovery").waitFor();
    await page.waitForFunction(()=>document.querySelector(".neerva-navigation-feedback")?.getAttribute("data-active")!== "true");
    const nav=await page.evaluate(()=>({feedback:window.__neervaClickFeedback,elapsed:performance.now()-(window.__neervaClickFeedback?.at??performance.now()),vitals:window.__neervaObservedVitals??[]}));
    assert.ok(nav.feedback?.active,"internal Link shows feedback synchronously without a full reload");
    assert.equal(await page.locator(".neerva-navigation-feedback").getAttribute("data-active"),null,"feedback clears after navigation");
    // A deliberately missing document emits a browser console 404. Check its HTTP
    // contract through the request context so real browser errors remain fatal.
    const invalid=await page.request.get(base+"/materials/no-such-category");
    try{assert.equal(invalid.status(),404,"missing catalog pages must keep real HTTP 404");}finally{await invalid.dispose();}
    performanceReports.push({route:"/ → /materials",width:v.w,clickToReadyMs:Math.round(nav.elapsed),observedBrowserVitals:nav.vitals,scope:"actual local Chromium measurements, not production population field data"});
   }
   // Room preview and Academy controls must work on phone and desktop.
   if(v.w===390||v.w===1440){
    await page.goto(base+"/room-lab",{waitUntil:"load"});
    await page.getByRole("button",{name:"Edit floor plan",exact:true}).click();
    const finish=page.locator(".room-lab-swatches button").first();
    await finish.scrollIntoViewIfNeeded();
    const preview=await page.locator(".room-lab-preview svg").boundingBox();
    assert.ok(preview&&preview.y+preview.height>0&&preview.y<v.h,"Live room preview remains visible during finish selection");
    await page.goto(base+"/build-iq",{waitUntil:"load"});
    const lab=page.locator(".visual-site-lab");
    assert.equal(await lab.locator(".field-guide-list article").count(),8,"eight practical field cases are accessible");
    assert.equal(await lab.locator("svg,canvas,video,iframe").count(),0,"field guide does not depend on decorative simulations");
    const masonry=lab.locator("#field-masonry");
    await masonry.getByText("Site checks and practical exercise",{exact:true}).click();
    assert.match(await masonry.innerText(),/28 m²/);
    const global=page.locator("#global-construction");
    assert.equal(await global.locator(".global-methods article").count(),3);
    assert.equal(await global.locator("iframe,video,canvas,svg").count(),0,"no heavy embedded media in construction guide");
    const methodPhoto=global.locator("img");assert.equal(await methodPhoto.count(),1,"one relevant construction reference");
    assert.equal(await methodPhoto.getAttribute("src"),"/images/knowledge/future/precast-construction.webp");assert.equal(await methodPhoto.getAttribute("loading"),"lazy");
    const source=global.locator("a[href^='https://']").first();
    assert.equal(await source.getAttribute("rel"),"noopener noreferrer");
    assert.equal(await source.getAttribute("referrerpolicy"),"no-referrer");
    const discovery=page.locator(".academy-discovery");
    await discovery.getByRole("searchbox").fill("zz-no-matching-lesson");
    assert.match(await discovery.innerText(),/0 lessons found/);
    await discovery.getByRole("searchbox").fill("");
    const link=discovery.locator(".academy-discovery-results a").first();
    const href=await link.getAttribute("href");
    const start=Date.now();
    await link.click();
    await page.waitForURL("**"+href);
    await page.locator(".academy-lesson h1").waitFor();
    performanceReports.push({route:"/build-iq → "+href,width:v.w,clickToReadyMs:Date.now()-start,scope:"local browser navigation"});
   }
   // Check the reported category media regression on every viewport.
   await page.goto(base+"/",{waitUntil:"load"});
   const housePhotos=await page.locator(".nbh-house-strip img,.nbh-studio-photo img,.nbh-photo-hero img").evaluateAll(imgs=>imgs.map(img=>{const src=img.getAttribute("src")??"";return new URL(src,location.origin).searchParams.get("url")??src;}));
   assert.equal(new Set(housePhotos).size,housePhotos.length,"No repeated house photograph across home sections");
   assert.equal(await page.locator(".nbh-family-card").count(),0,"Keep the premium homepage focused");
   assert.equal(await page.locator(".nbh-family-entry").count(),1,"Family planning entry point");
   await page.goto(base+"/family-homes",{waitUntil:"load"});
   assert.equal(await page.locator(".nbh-family-card").count(),4,"Separate family planning page");
   const familyPhotos=page.locator(".nbh-family-photo img");
   assert.equal(await familyPhotos.count(),3,"Three distinct family-home visual concepts");
   for(const img of await familyPhotos.all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());assert.ok(await img.evaluate(el=>el.naturalWidth>0&&el.naturalHeight>0),"Family-home image decodes");}
   assert.equal(new Set(await familyPhotos.evaluateAll(imgs=>imgs.map(img=>img.getAttribute("src")))).size,3,"No repeated family visual");
   const familyLinks=await page.locator('.nbh-family-card a[href^="/design-studio/portfolio?"]').evaluateAll(links=>links.map(a=>{const q=new URL(a.href).searchParams;return ["width","depth","bedrooms","floors"].map(k=>q.get(k)).join("x");}));
   assert.deepEqual(familyLinks,["15x30x1x1","18x50x3x2","20x40x2x1"],"Family home cards use supported plot and room briefs");
   const guide=page.locator("#family-guide");
   assert.equal(await page.locator("#family-budget,input[type=number]").count(),0,"no duplicated calculator on family page");
   assert.equal(await guide.locator(".family-editorial-body section").count(),4,"practical room and construction guidance");
   assert.equal(await guide.locator(".learning-photo img[loading=lazy]").count(),2,"two local interior references");
   assert.equal(await page.locator(".family-stage-timeline li").count(),4,"construction stages remain connected");
   await guide.getByText("Protect essential spending",{exact:true}).click();
   assert.equal(await guide.locator("details[open]").count(),1);
   assert.ok(await guide.evaluate(el=>el.scrollWidth<=el.clientWidth+1),"family guide fits viewport");
   assert.equal(await guide.locator('a[href="/my-project"]').count(),1,"reuse existing project workspace");
   await guide.locator('a[href="/learn/property-guide"]').click();
   await page.locator(".property-guide").waitFor();
   assert.equal(await page.locator(".property-checks input[type=checkbox]").count(),12);
   assert.equal(await page.locator(".property-documents dt").count(),8);
   for(const img of await page.locator(".property-chapter-intro img").all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());assert.ok(await img.evaluate(el=>el.naturalWidth>0&&el.getAttribute("src").startsWith("/images/")&&el.loading==="lazy"));}
   assert.ok(await page.locator(".property-guide").evaluate(el=>el.scrollWidth<=el.clientWidth+1),"property guide remains responsive");


   await page.goto(base+"/",{waitUntil:"load"});
   const categoryCards=page.locator(".nbh-material-card");
   assert.equal(await categoryCards.count(),9,"all home material categories");
   assert.ok((await categoryCards.evaluateAll(cards=>cards.every(c=>c.querySelectorAll(".nbh-material-main-photo img").length===(c.querySelector(".nbh-cement-preview")?2:1)&&c.querySelectorAll(".nbh-material-image img").length===(c.querySelector(".nbh-hardware-preview")?3:c.querySelector(".nbh-cement-preview")?2:1)))),"one primary image per category card");
   await categoryCards.first().scrollIntoViewIfNeeded();
   assert.equal(await page.locator('.nbh-material-choices a[href="/materials/bricks-blocks/red-clay-brick"]').count(),1);
   const mediaIssues=await categoryCards.evaluateAll(cards=>cards.flatMap(card=>{
    const img=card.querySelector(".nbh-material-main-photo img");
    const frame=card.querySelector(".nbh-material-image");
    const a=card.getBoundingClientRect(),b=frame?.getBoundingClientRect();
    return !img||!b||getComputedStyle(img).objectFit!==(frame.matches(".nbh-hardware-preview,.nbh-cement-preview")?"contain":"cover")||b.width<100||b.height<75||b.right>a.right+1?["invalid category image frame"]:[];
   }));
   assert.deepEqual(mediaIssues,[],"home category media fills frame at "+v.w);
   assert.equal(await page.locator(".nbh-material-options[open]").count(),0,"compact category choices closed initially");
   const cardRows=await categoryCards.evaluateAll(cards=>{
    const rows=new Map();
    for(const card of cards){const r=card.getBoundingClientRect(),cta=card.querySelector(".nbh-material-cta")?.getBoundingClientRect();const key=Math.round(r.top);const row=rows.get(key)??[];row.push({height:r.height,bottom:cta?.bottom??0});rows.set(key,row)}
    return [...rows.values()].flatMap(row=>row.length<2?[]:row.slice(1).map(c=>({height:Math.abs(c.height-row[0].height),cta:Math.abs(c.bottom-row[0].bottom)})));
   });
   assert.ok(cardRows.every(r=>r.height<=2&&r.cta<=3),"category cards in each row have equal height and aligned actions");
   assert.equal(await page.locator("footer.unified-footer").count(),1,"home shares the unified footer");
   assert.equal(await page.locator("footer.unified-footer nav").count(),4,"footer groups are structured");
   assert.equal(await page.locator("header a.header-install,header a.nbh-install-header").count(),0,"installation never occupies primary header space");
   if(v.w<=760){
    const menu=page.locator(".nbh-mobile-menu"),trigger=menu.locator("summary");
    await trigger.click();
    assert.notEqual(await menu.getAttribute("open"),null,"menu opens through icon");
    assert.ok(await menu.getByRole("navigation").isVisible(),"menu navigation visible");
    await page.keyboard.press("Escape");
    assert.equal(await menu.getAttribute("open"),null,"Escape closes menu");
    assert.ok(await trigger.evaluate(el=>document.activeElement===el),"Escape restores trigger focus");
    await trigger.click();
    // The open menu legitimately overlays the hero heading on narrow screens.
    // Pick a real hit-tested point outside the disclosure, then use native pointer input.
    const outside=await menu.evaluate(el=>{
     const panel=el.querySelector("nav")?.getBoundingClientRect();
     const viewport=document.documentElement.clientWidth;
     for(const y of [8,24,48,Math.floor(innerHeight*.85),innerHeight-20]){
      for(const x of [4,Math.floor(viewport*.25),Math.floor(viewport*.5),viewport-5]){
       const hit=document.elementFromPoint(x,y);
       if(hit&&!el.contains(hit)&&!(hit.closest("a,button,summary,input,select,textarea,[role=button]"))&&(!panel||x<panel.left||x>panel.right||y<panel.top||y>panel.bottom))return {x,y};
      }
     }
     return null;
    });
    assert.ok(outside,"an unobstructed outside-menu pointer target exists");
    await page.mouse.click(outside.x,outside.y);
    assert.equal(await menu.getAttribute("open"),null,"outside click closes menu");
    await trigger.click();
    await menu.locator('a[href="/materials"]').click();
    await page.waitForURL(base+"/materials");
    const sharedMenu=page.locator(".site-mobile-menu");
    assert.equal(await sharedMenu.getAttribute("open"),null,"navigation closes menu");
    assert.equal(await page.locator("header a.header-install").count(),0,"shared header never reserves install space");
    await page.goto(base+"/",{waitUntil:"load"});
   }
   const footer=page.locator("footer.unified-footer");
   const footerLayout=await footer.evaluate(el=>{
    const groups=[...el.querySelectorAll(".unified-footer-groups nav")];
    const rects=groups.map(g=>g.getBoundingClientRect());
    const links=[...el.querySelectorAll(".unified-footer-groups a")].filter(a=>a.getClientRects().length);
    const b=el.getBoundingClientRect();
    return {columns:new Set(rects.map(r=>Math.round(r.left))).size,topAligned:Math.abs(rects[0].top-rects[1].top)<=2,overflow:el.scrollWidth>el.clientWidth+2,linkFits:links.every(a=>{const r=a.getBoundingClientRect();return r.left>=b.left-1&&r.right<=b.right+1}),touch:links.every(a=>a.getBoundingClientRect().height>=29),linkCount:links.length,headingGaps:groups.map(g=>g.querySelector("ul").getBoundingClientRect().top-g.querySelector("h3").getBoundingClientRect().bottom),linkGaps:groups.flatMap(g=>{const a=[...g.querySelectorAll("a")];return a.slice(1).map((link,i)=>link.getBoundingClientRect().top-a[i].getBoundingClientRect().bottom)}),headingHierarchy:groups.every(g=>{const h=getComputedStyle(g.querySelector("h3")),a=getComputedStyle(g.querySelector("a"));return Number.parseFloat(h.fontSize)>Number.parseFloat(a.fontSize)&&Number.parseInt(h.fontWeight)>=700}),rowHeights:links.map(a=>a.getBoundingClientRect().height),appTarget:el.querySelector(".unified-footer-app-link")?.getBoundingClientRect().height??44,height:b.height,sectionGaps:[...el.querySelectorAll(".unified-footer-intro,.unified-footer-groups,.unified-footer-app,.unified-footer-bottom")].map((section,i,sections)=>i?Math.max(0,section.getBoundingClientRect().top-sections[i-1].getBoundingClientRect().bottom):0),emptyGroupSpace:groups.map(g=>{const heading=g.querySelector("h3"),list=g.querySelector("ul");if(!heading||!list)return Infinity;return Math.max(0,list.getBoundingClientRect().top-heading.getBoundingClientRect().bottom)+Math.max(0,g.getBoundingClientRect().bottom-list.getBoundingClientRect().bottom)}),legal:el.querySelectorAll(".unified-footer-legal a").length};
   });
   assert.equal(footerLayout.columns,v.w<=900?2:4,"footer columns adapt to viewport");
   assert.ok(footerLayout.topAligned&&!footerLayout.overflow&&footerLayout.linkFits,"footer headings and links stay within the layout");
   assert.equal(footerLayout.linkCount,22,"all business navigation links remain visible");
   assert.ok(footerLayout.headingHierarchy,"footer headings are visually stronger than subordinate links");
   assert.ok(footerLayout.headingGaps.every(g=>g>=2&&g<=8),"heading-to-link gap stays small and consistent: "+JSON.stringify(footerLayout.headingGaps));
   assert.ok(footerLayout.linkGaps.every(g=>g>=-1&&g<=2),"links within a section have no excessive row gaps");
   if(v.w<=650){assert.ok(footerLayout.touch,"mobile footer navigation targets remain at least 30px");assert.ok(footerLayout.rowHeights.every(h=>h<=56),"footer link rows remain compact");assert.ok(footerLayout.appTarget>=43,"app action retains 44px target");}
   assert.equal(footerLayout.legal,3,"legal policies have a compact dedicated row");
   // Measure empty gaps, not the total height of valid content (e.g. Hindi wrapping).
   assert.ok(footerLayout.sectionGaps.every(g=>g<=12),"footer section gaps: "+JSON.stringify(footerLayout));
   assert.ok(footerLayout.emptyGroupSpace.every(g=>g<=12),"footer group whitespace: "+JSON.stringify(footerLayout));
   assert.ok(footerLayout.height>0&&Number.isFinite(footerLayout.height),"footer height is measurable");
   fs.writeFileSync(path.join("test-results/mobile",v.w+"-footer-layout.json"),JSON.stringify(footerLayout,null,2));
   await footer.screenshot({path:path.join("test-results/mobile",v.w+"-unified-footer.png"),animations:"disabled"});
   await page.locator(".nbh-material-options summary").first().click();
   assert.equal(await page.locator(".nbh-material-options[open]").count(),1,"subcategory links remain expandable");
   for(const category of ["bricks-blocks","plumbing","tiles","hardware"]){
    const res=await page.goto(base+"/materials/"+category,{waitUntil:"load"});
    assert.equal(res?.status(),200,category);
    assert.ok(await page.locator(".customer-material-choice").count()>=4,category+" product shortcuts");
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=2,category+" overflow at "+v.w);
   }
   await page.goto(base+"/materials/plumbing",{waitUntil:"load"});
   await page.getByRole("link",{name:"Browse electrical →",exact:true}).click();
   await page.waitForURL("**/materials/electrical");
   assert.ok(await page.locator(".pipe-use-links a").count()>=8,"direct electrical family routes");
   assert.ok(await page.locator("#material-ranges .product-card").count()<=12,"bounded initial catalog cards");
   const firstFamily=page.locator(".pipe-use-links a").first();
   const destination=await firstFamily.getAttribute("href");
   assert.ok(destination?.startsWith("/materials/electrical/"),"family link opens exact product, not broad search");
   await firstFamily.click();
   await page.waitForURL("**"+destination);
   assert.ok(await page.locator(".product-request-config").isVisible(),"quantity and order controls on product");
   assert.equal(await page.getByRole("link",{name:"Request order →",exact:true}).count(),1,"one primary order action");
   await page.goto(base+"/materials",{waitUntil:"load"});
   const catalog=page.locator("#catalog-results");
   await catalog.locator(".product-card").first().waitFor();
   assert.equal(await catalog.locator(".product-card").count(),24,"Bound first-page DOM at "+v.w);
   const firstPage=await catalog.locator(".product-card h2 a").evaluateAll(links=>links.map(a=>a.getAttribute("href")));
   await catalog.getByRole("button",{name:"Next →",exact:true}).click();
   const secondPage=await catalog.locator(".product-card h2 a").evaluateAll(links=>links.map(a=>a.getAttribute("href")));
   assert.ok(secondPage.length>0&&secondPage.length<=24,"Next page stays bounded");
   assert.ok(secondPage.every(h=>!firstPage.includes(h)),"No repeated family between pages");
   await catalog.getByRole("button",{name:"← Previous",exact:true}).click();
   assert.deepEqual(await catalog.locator(".product-card h2 a").evaluateAll(links=>links.map(a=>a.getAttribute("href"))),firstPage);
   await catalog.locator(".catalog-search input").fill("red clay brick");
   await catalog.locator('a[href="/materials/bricks-blocks/red-clay-brick"]').first().waitFor({state:"visible",timeout:10000});
   assert.ok(await catalog.locator('a[href="/materials/bricks-blocks/red-clay-brick"]').count()>0,"Search still discovers products beyond first page");
   await page.goto(base+"/materials?category=hardware",{waitUntil:"load"});
   assert.equal(await page.locator('#catalog-results a[href="/materials/hardware/wood-adhesive"]').count(),0,"Minor adhesive bottle must not appear in the public grid");
   await page.goto(base+"/materials/hardware",{waitUntil:"load"});
   assert.equal(await page.locator('.hardware-showroom a[href="/materials/hardware/wood-adhesive"]').count(),0,"Hardware showroom hides small accessories");
   await page.goto(base+"/materials/plumbing",{waitUntil:"load"});
   assert.equal(await page.locator('#fitting-showroom a[href="/materials/plumbing/fitting-gasket"]').count(),0,"Fittings showroom hides minor consumables");
   const redBrick=await page.goto(base+"/materials/bricks-blocks/red-clay-brick",{waitUntil:"load"});
   assert.equal(redBrick?.status(),200,"red brick details");
   assert.match(await page.locator("h1").first().innerText(),/red clay brick/i);
   if(v.w===390){
    const save=page.getByRole("button",{name:"Save for my project",exact:true});
    await save.waitFor();await save.click();
    await page.getByRole("button",{name:"Saved ✓",exact:true}).waitFor();
    await page.goto(base+"/my-project",{waitUntil:"load"});
    const shortlist=page.locator("#saved-materials");
    await shortlist.getByRole("heading",{name:"Saved materials",exact:true}).waitFor();
    assert.ok(await shortlist.getByRole("link",{name:/red clay brick/i}).count()>=1);
    await page.getByRole("button",{name:/Foundation/}).first().click();
    await page.locator('.project-materials a[href="/build-iq/handbook/ground"]').waitFor();
    await page.goto(base+"/",{waitUntil:"load"});
    await page.getByRole("heading",{name:"Pick up where you left off"}).waitFor();
    await page.goto(base+"/my-project",{waitUntil:"load"});
    await page.getByRole("checkbox",{name:"Remember recently viewed materials on this device"}).uncheck();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("neerva-material-shortlist-v1")).recent.length),0);
    await page.locator("#saved-materials").getByRole("button",{name:/Remove red clay brick/i}).click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("neerva-material-shortlist-v1")).saved.length),0);
   }

   if(v.w===390||v.w===1440){
    const sizes=v.w===390?[[320,568],[360,800],[390,844],[412,915],[540,720],[768,1024],[844,390]]:[[1024,768],[1280,720],[1440,900],[1920,1080],[2560,1440]];
    for(const route of ["/design-studio/road-planner","/design-studio/portfolio?width=18&depth=50&road=N&bedrooms=3&floors=2&parking=true"]){
     await page.goto(base+route,{waitUntil:"load"});
     await page.locator(".nroad-3d-slot").scrollIntoViewIfNeeded();
     await page.locator(".nbd-building canvas, .nbd-building svg").first().waitFor({timeout:30000});
     for(const [width,height] of sizes){
      await page.setViewportSize({width,height});
      for(const language of ["English","Hindi"]){
       if(language==="Hindi")await page.locator(".nroad-nav button").click();
       await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
       const issues=await page.evaluate(expected=>{
        const root=document.documentElement;
        const problems=[];
        for(const selector of [".nroad",".nroad-nav",".nroad-main",".nroad-hero",".nroad-controls",".nroad-results",".site-footer"]){
         const rect=document.querySelector(selector).getBoundingClientRect();
         const column=selector===".nroad-controls"||selector===".nroad-results";
         const minimum=column?(expected<=980?expected-84:selector===".nroad-controls"?230:400):Math.min(expected,selector===".nroad-main"?1370:selector===".nroad-hero"?1140:expected)-2;
         if(rect.left< -1||rect.right>expected+1||rect.width<minimum)problems.push(selector+" "+Math.round(rect.left)+".."+Math.round(rect.right));
        }
        if(expected>980){
         const controls=document.querySelector(".nroad-controls").getBoundingClientRect();
         const results=document.querySelector(".nroad-results").getBoundingClientRect();
         if(controls.right>=results.left)problems.push("Desktop columns overlap");
        }
        if(root.scrollWidth>expected+1||innerWidth>expected+1){
         const outliers=[...document.querySelectorAll("body *")].filter(el=>el.getBoundingClientRect().right>expected+1).slice(0,8);
         problems.push("Page width "+root.scrollWidth+"; "+outliers.map(el=>el.tagName+"."+el.getAttribute("class")).join(", "));
        }
        return problems;
       },width);
       assert.deepEqual(issues,[],route+" at "+width+"px in "+language);
       if(language==="Hindi")await page.locator(".nroad-nav button").click();
      }
     }
     await page.setViewportSize({width:v.w,height:v.h});
    }
   }
   if(v.w===390||v.w===1440){
    // A fresh context ensures a direct brand route never relies on materials CSS from prior navigation.
    const brandContext=await browser.newContext({viewport:{width:v.w,height:v.h}});
    try{
     const brandPage=await brandContext.newPage();
     const response=await brandPage.goto(base+"/brands/cement/ultratech",{waitUntil:"load",timeout:60000});
     assert.equal(response?.status(),200,"direct brand detail route");
     const cards=brandPage.locator(".br-card .tile-swatch .catalog-material-image");
     assert.ok(await cards.count()>0,"brand range must contain product cards");
     const errors=await cards.evaluateAll(items=>items.flatMap(el=>{
      const container=el.getBoundingClientRect(),card=el.closest(".br-card").getBoundingClientRect();
      const child=el.querySelector("img,.catalog-material-identity");
      const inside=child?.getBoundingClientRect();
      return getComputedStyle(el).position!=="relative"||container.height<100||container.left<card.left-1||container.right>card.right+1||(inside&&(inside.left<container.left-1||inside.right>container.right+1||inside.top<container.top-1||inside.bottom>container.bottom+1))?["uncontained brand media"]:[];
     }));
     assert.deepEqual(errors,[],"direct brand route positions media and specification fallback safely");
    }finally{await brandContext.close();}
   }
   if(v.w===390){
    // Verify role shells, legal/support destinations, and catalog routes not in the
    // repeated five-viewport sample. Status checks avoid creating fake test orders.
    const extraPages=[
      "/admin/catalog","/admin/rfqs","/admin/fulfilment","/admin/pricing","/admin/orders",
      "/admin/studio","/admin/studio-payments","/admin/system-health","/admin/users",
      "/dealer/inventory","/dealer/quotes","/dealer/orders","/account/orders","/account/quotes",
      "/support","/privacy","/brands","/business-model","/calculators","/blog","/my-project","/family-homes","/contractors",
      "/learn/plot-size-in-gaj","/learn/2d-to-3d-house-layout","/learn/wall-paint-pattern-ideas",
      "/materials/cement","/materials/steel","/materials/tiles","/materials/plumbing",
      "/materials/bricks-blocks","/materials/electrical","/materials/paint",
      "/materials/hardware","/materials/aggregates"
    ];
    for(const route of extraPages){
      const res=await page.goto(base+route,{waitUntil:"load",timeout:60000});
      if(res?.status()!==200)failures.push("390px role/footer/catalog route "+route+" returned "+String(res?.status()));
      const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-document.documentElement.clientWidth);
      if(overflow>2)failures.push("390px "+route+": "+overflow+"px horizontal overflow");
    }
   }
   if(v.w===390){
    // PWA is installable without storing private pages or fabricating offline orders.
    const manifest=await page.request.get(base+"/manifest.webmanifest");
    assert.equal(manifest.status(),200,"manifest route");
    const appManifest=await manifest.json();
    assert.equal(appManifest.name,"NEERVA BUILD — Build better. Buy smarter.","native manifest provides brand and marketing tagline");
    assert.equal(appManifest.short_name,"NEERVA BUILD","launcher retains the concise existing name");
    assert.ok(appManifest.description.startsWith("Build better. Buy smarter."),"manifest description reinforces the same positioning");
    assert.equal(appManifest.id,"/","existing installed app identity stays unchanged");
    assert.equal(appManifest.start_url,"/","native startup opens home directly");
    assert.equal(appManifest.scope,"/","PWA scope remains unchanged");
    assert.equal(appManifest.background_color,"#f5f4ef","startup paper surface");
    assert.equal(appManifest.theme_color,"#263e33","native brand theme");
    await page.goto(base+"/",{waitUntil:"load"});
    assert.equal(await page.locator('meta[name="theme-color"]').getAttribute("content"),appManifest.theme_color,"native and web theme colors match");
    const surfaces=await page.evaluate(()=>({root:getComputedStyle(document.documentElement).backgroundColor,body:getComputedStyle(document.body).backgroundColor,home:getComputedStyle(document.querySelector(".nbh")).backgroundColor}));
    assert.deepEqual(surfaces,{root:"rgb(245, 244, 239)",body:"rgb(245, 244, 239)",home:"rgb(245, 244, 239)"},"manifest and first page surfaces agree");
    assert.ok(appManifest.icons?.some(icon=>icon.purpose?.includes("maskable")),"PWA maskable icon");
    for(const size of [192,512]){
     const icon=appManifest.icons.find(i=>i.sizes===size+"x"+size&&i.purpose==="any");
     assert.ok(icon,"PWA icon "+size+"px must be declared");
     const response=await page.request.get(new URL(icon.src,base).href);
     assert.equal(response.status(),200);assert.match(response.headers()["content-type"],/image\/png/);
     const bytes=await response.body();assert.equal(bytes.subarray(1,4).toString(),"PNG");assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
    }
    for(const asset of ["/icon","/apple-icon"]){
      const response=await page.request.get(base+asset);
      assert.equal(response.status(),200,asset+" PNG route");
      assert.match(response.headers()["content-type"]??"",/image\/png/,asset+" must be real PNG");
    }
    const worker=await page.request.get(base+"/sw.js");
    assert.equal(worker.status(),200,"SW registration file");
    assert.match(await worker.text(),/api\|account\|admin\|dealer/,"private navigation is excluded from offline caching");
    const offline=await page.request.get(base+"/offline.html");
    assert.equal(offline.status(),200,"safe offline page");
    assert.match(await offline.text(),/No order or payment has been submitted offline/);
    await page.goto(base+"/install",{waitUntil:"load"});
    await page.getByRole("heading",{name:"Get Neerva on your device"}).waitFor({state:"visible"});
    assert.equal(await page.locator(".neerva-install-banner").count(),0,"no duplicate global banner on install instructions");
    await page.evaluate(()=>{
      const event=new Event("beforeinstallprompt",{cancelable:true});
      Object.assign(event,{prompt:async()=>undefined,userChoice:Promise.resolve({outcome:"accepted"})});
      window.dispatchEvent(event);
    });
    assert.equal(await page.locator(".unified-footer-app").count(),0,"install page avoids a duplicate footer CTA");
    const pageInstall=page.locator(".install-action").getByRole("button",{name:"Install Neerva",exact:true});
    await pageInstall.waitFor({state:"visible"});
    await pageInstall.click();
    await page.getByText("Installation accepted. Check your home screen.").waitFor();
    // Acceptance alone is not proof of installation. Exercise the actual browser-event contract.
    await page.evaluate(()=>window.dispatchEvent(new Event("appinstalled")));
    await page.getByRole("heading",{name:"Neerva is ready to use"}).waitFor({state:"visible"});
    assert.equal(await page.locator('a[href="/install"]').count(),0,"installed state hides shared header, menu and footer install links");
    await page.getByRole("link",{name:"Open Neerva",exact:true}).click();
    await page.waitForURL(base+"/");
    await page.locator(".nbh-header").waitFor({state:"visible"});
    assert.equal(await page.locator('a[href="/install"]').count(),0,"client navigation keeps install controls hidden");
    assert.equal(await page.locator(".unified-footer-groups a[href=\"/install\"]").count(),0,"install never sits in business links");
    await page.locator(".unified-footer-app a[href='/install?recovery=1']").waitFor({state:"visible"});
    assert.equal(await page.locator(".unified-footer-app a[href=\"/install?recovery=1\"]").count(),1,"remembered installation exposes only app help");
    assert.equal(await page.locator(".neerva-install-banner").count(),0,"installed app never displays install banner");
    await page.reload({waitUntil:"load"});
    // load is not hydration: the initial install state deliberately renders no links.
    // Require positive evidence that the PWA store has subscribed and restored the
    // installed preference before dispatching a synthetic browser lifecycle event.
    const restoredHelp=page.locator(".nbh-mobile-menu a[href='/install?recovery=1']");
    await restoredHelp.waitFor({state:"attached"});
    await page.locator(".unified-footer-app a[href='/install?recovery=1']").waitFor({state:"visible"});
    assert.equal(await page.locator('a[href="/install"]').count(),0,"installed state survives reload");
    // Simulate an uninstall with a fresh browser installability event. No storage clearing.
    await page.evaluate(()=>{
      const event=new Event("beforeinstallprompt",{cancelable:true});
      Object.assign(event,{prompt:async()=>undefined,userChoice:Promise.resolve({outcome:"dismissed"})});
      window.dispatchEvent(event);
    });
    await page.locator(".nbh-mobile-menu a[href='/install']").waitFor({state:"attached"});
    await restoredHelp.waitFor({state:"detached"});
    assert.equal(await page.evaluate(()=>localStorage.getItem("neerva-installed-v1")),null,"fresh installability event clears remembered installation");
    const footerInstall=page.locator(".unified-footer-app button");
    await footerInstall.waitFor({state:"visible"});
    assert.equal(await footerInstall.getAttribute("type"),"button","installation is a native action, not a store link");
    assert.equal(await footerInstall.locator("svg.unified-footer-app-mark").count(),1,"one independent app installation icon");
    assert.equal(await footerInstall.innerText().then(s=>s.replace(/\s+/g," ").trim()),"Install Neerva","install action has no arrow or misleading store branding");
    assert.equal(await page.locator(".unified-footer-app a[href='/install']").count(),0,"footer install never navigates to installation page");
    const beforeInstallUrl=page.url();
    await page.evaluate(()=>{window.__footerNativePrompts=0;const event=new Event("beforeinstallprompt",{cancelable:true});Object.assign(event,{prompt:async()=>{window.__footerNativePrompts++;},userChoice:Promise.resolve({outcome:"dismissed"})});window.dispatchEvent(event);});
    await footerInstall.click();
    await page.locator(".unified-footer-install-feedback").filter({hasText:"Installation cancelled"}).waitFor();
    assert.equal(await page.evaluate(()=>window.__footerNativePrompts),1,"footer calls native install prompt exactly once");
    assert.equal(page.url(),beforeInstallUrl,"dismissed native install stays on current page");
    const fallback=page.locator(".unified-footer-app a.unified-footer-app-link[href='/install']");
    await fallback.waitFor({state:"visible"});
    assert.equal(await footerInstall.count(),0,"consumed prompt must not offer another native action");
    assert.equal(page.url(),beforeInstallUrl,"dismissal leaves the user on the current page");
    assert.equal(await fallback.innerText(),"Get Neerva app","unsupported browser offers setup guidance, not fake install");
    await page.evaluate(()=>{const event=new Event("beforeinstallprompt",{cancelable:true});Object.assign(event,{prompt:async()=>{window.__footerNativePrompts++;},userChoice:Promise.resolve({outcome:"accepted"})});window.dispatchEvent(event);});
    await footerInstall.click();
    await page.locator(".unified-footer-install-feedback").filter({hasText:"Installation accepted"}).waitFor();
    assert.equal(page.url(),beforeInstallUrl,"accepted native install stays on current page");
    assert.equal(await page.evaluate(()=>window.__footerNativePrompts),2,"fresh native prompt is used on retry");
    await page.waitForFunction(()=>localStorage.getItem("neerva-installed-v1")===null);
    // Also verify a user can recover if the browser never emits an uninstall or installability signal.
    await page.evaluate(()=>window.dispatchEvent(new Event("appinstalled")));
    await page.locator(".nbh-mobile-menu a[href='/install?recovery=1']").waitFor({state:"attached"});
    await page.goto(base+"/install?recovery=1",{waitUntil:"load"});
    await page.getByRole("button",{name:"App removed? Set up again",exact:true}).click();
    await page.getByRole("heading",{name:"Get Neerva on your device"}).waitFor({state:"visible"});
    assert.equal(await page.evaluate(()=>localStorage.getItem("neerva-installed-v1")),null,"recovery clears only installation preference");
    await page.goto(base+"/",{waitUntil:"load"});
    assert.equal(await page.locator(".neerva-install-banner").count(),0,"manual recovery does not trigger an immediate popup");
    // Separately emulate the standalone browser media query before app hydration.
    const standaloneCtx=await browser.newContext({viewport:{width:390,height:844}});
    try{
      await standaloneCtx.addInitScript(()=>{
        const original=window.matchMedia.bind(window);
        window.matchMedia=query=>{const result=original(query);return query==="(display-mode: standalone)"?new Proxy(result,{get(target,key){if(key==="matches")return true;const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;}}):result;};
      });
      const installedPage=await standaloneCtx.newPage();
      for(const route of ["/install","/","/materials"]){
        await installedPage.goto(base+route,{waitUntil:"load"});
        await installedPage.waitForFunction(()=>localStorage.getItem("neerva-installed-v1")==="1");
        assert.equal(await installedPage.locator('a[href="/install"]').count(),0,route+" standalone hides all install links");
        assert.equal(await installedPage.locator(".neerva-install-banner").count(),0,route+" standalone hides banner");
        assert.equal(await installedPage.locator('a[href="/install?recovery=1"]').count(),0,"standalone hides recovery navigation");
        assert.equal(await installedPage.locator(".unified-footer-app").count(),0,"standalone hides the entire footer install utility");
        assert.equal(await installedPage.getByRole("button",{name:"App removed? Set up again",exact:true}).count(),0,"standalone cannot clear installed state");
        if(route==="/install")await installedPage.getByRole("heading",{name:"Neerva is ready to use"}).waitFor();
      }
    }finally{await standaloneCtx.close();}
    const account=await page.goto(base+"/account",{waitUntil:"load"});
    assert.equal(account?.status(),200,"authenticated account route");
    assert.equal(await page.getByRole("heading",{name:/Your account. Your build./}).count(),1,"account page must not show prelaunch placeholder");
    if(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY){
      const form=page.locator("form.account-auth-form").filter({has:page.locator("input[name=password]")});
      await form.getByRole("button",{name:"Sign in securely →",exact:true}).waitFor({state:"visible"});
      assert.equal(await form.count(),1,"one password sign-in form");
      assert.equal(await form.getByRole("button",{name:"Sign in securely →",exact:true}).count(),1,"one password submission action");
      assert.equal(await form.locator("input[name=email]").count(),1,"email input present");
      assert.equal(await form.locator("input[name=password]").count(),1,"password input present");
    }else{
      assert.equal(await page.getByText("Waiting for backend setup").count(),1,"unconfigured account must not collect passwords");
    }
    // Exercise the actual account shells at narrow, landscape and wide sizes.
    // Signed-in card/CRUD checks are reserved for isolated authenticated fixtures.
    const previousAccountViewport=page.viewportSize();
    for(const size of [{width:320,height:568},{width:360,height:800},{width:390,height:844},{width:600,height:900},{width:768,height:1024},{width:844,height:390},{width:1024,height:768},{width:1440,height:900},{width:1920,height:1080}]){
      await page.setViewportSize(size);
      for(const route of ["/account","/account/addresses"]){
        await page.goto(base+route,{waitUntil:"load"});
        const region=page.locator(".naccount-page");await region.waitFor();
        const metrics=await region.evaluate(el=>{const r=el.getBoundingClientRect();const controls=[...el.querySelectorAll("button,input:not([type=checkbox]),select,textarea")].filter(n=>n.getClientRects().length);return {width:r.width,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2||el.scrollWidth>el.clientWidth+2,fit:controls.every(n=>{const b=n.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1&&b.height>=44})}});
        assert.ok(metrics.width>0&&!metrics.overflow&&metrics.fit,route+" responsive account controls at "+size.width+"px");
      }
    }
    if(previousAccountViewport)await page.setViewportSize(previousAccountViewport);
    const unauth=await page.request.post(base+"/api/rfqs",{data:{idempotencyKey:"f1d3068d-3f5f-4e5c-a14e-2546fb9902ed"}});
    const expectedUnauth=process.env.NEERVA_RFQ_INTAKE_ENABLED==="true"&&process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?401:503;
    assert.equal(unauth.status(),expectedUnauth,"RFQ must fail closed: 401 only when intake and auth are enabled, otherwise 503");
    await page.goto(base+"/",{waitUntil:"load"});
    assert.equal(await page.locator(".neerva-install-banner").count(),0,"no immediate arrival promotion");
    await page.locator(".nbh-mobile-menu a[href='/install']").waitFor({state:"attached"});
    const emitInstallPrompt=()=>page.evaluate(()=>{
      const event=new Event("beforeinstallprompt",{cancelable:true});
      Object.assign(event,{prompt:async()=>undefined,userChoice:Promise.resolve({outcome:"dismissed"})});
      window.dispatchEvent(event);
    });
    await emitInstallPrompt();
    assert.equal(await page.locator(".neerva-install-banner").count(),0,"native prompt is not promoted immediately");
    const banner=page.locator(".neerva-install-banner");
    await banner.waitFor({state:"visible",timeout:15000});
    assert.equal(await banner.getByRole("button",{name:"Install free app",exact:true}).count(),1,"only real installation is promoted");
    assert.equal(await banner.getByRole("link").count(),0,"manual installation help remains in navigation, not popup");
    await banner.getByRole("button",{name:"Continue browsing",exact:true}).click();
    await banner.waitFor({state:"detached"});
    assert.ok(await page.evaluate(()=>Number(localStorage.getItem("neerva-install-dismissed-until-v2"))>Date.now()),"dismissal persists cooldown");
    await page.reload({waitUntil:"load"});
    await page.locator(".nbh-mobile-menu a[href='/install']").waitFor({state:"attached"});
    await emitInstallPrompt();
    assert.equal(await page.locator(".neerva-install-banner").count(),0,"cooldown does not remove manual navigation");
    // Keep testing private and transaction routes without install interference.
    // Payment safety: public pricing is readable; unauthenticated users must not
    // see a simulated paid QR or receive an entitlement from a bare POST.
    await page.goto(base+"/studio-pricing",{waitUntil:"load"});
    assert.equal(await page.getByRole("heading",{name:/Start with a real sample/i}).count(),1,"public Studio price page renders");
    const guestPurchase=await page.request.post(base+"/api/studio/payments",{
      data:{product:"home_studio"},headers:{"Content-Type":"application/json"}
    });
    assert.ok([401,403,503].includes(guestPurchase.status()),"unauthenticated payment cannot create an order");
    assert.equal(await page.locator(".studio-upgrade-qr svg").count(),0,"no static guest payment QR or fake checkout success");
    // Authenticated role isolation needs live fixture accounts and cannot be simulated by guest screenshots.
    for(const roleRoute of ["/account/quotes","/dealer/quotes","/admin/catalog"]){
      const response=await page.goto(base+roleRoute,{waitUntil:"load"});
      assert.equal(response?.status(),200,roleRoute+" public route shell");
      await page.screenshot({path:path.join("test-results/mobile","390-role-"+roleRoute.replaceAll("/","-")+".png"),fullPage:true,animations:"disabled"});
    }
    // No real install API, so no fake installation success is emitted by smoke tests.
   }
   if(v.w===390){
    // Business-flow smoke: category -> product -> local planning list -> quote.
    await page.goto(base+"/quotes",{waitUntil:"load"});
    assert.equal(await page.locator("#neerva-quote-form").count(),1,"quote form is available at all viewports");
    assert.equal(await page.getByRole("button",{name:"Copy material quote draft"}).count(),1,"local quote preparation must work even when RFQ submission is disabled");
    await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,
     value:{writeText:async text=>{window.__neervaCopiedDraft=text;}}}));
    await page.locator('input[name="materialDescription"]').fill("Cement 50kg PPC");
    await page.locator('input[name="quantity"]').fill("12");
    await page.locator('input[name="city"]').fill("Lucknow");
    await page.locator('input[name="pincode"]').fill("226001");
    await page.getByRole("button",{name:"Copy material quote draft"}).click();
    const copied=await page.evaluate(()=>window.__neervaCopiedDraft??"");
    assert.match(copied,/NOT sent/,"draft never implies actual dealer delivery");
    assert.match(copied,/Lucknow/);
    assert.doesNotMatch(copied,/contact mobile|phone number/i,"draft does not copy personal contact data");
    await page.goto(base+"/design-studio",{waitUntil:"load"});
    assert.equal(await page.locator(".nstudio-start-form").count(),1,"home studio must start with plot fields, not an unscaled static concept");
    assert.equal(await page.locator(".nstudio-section-nav a").count(),5,"studio sections have direct navigation");
    assert.equal(await page.locator(".nstudio-purpose-links a").count(),5,"commercial purposes are discoverable");
    assert.equal(await page.locator(".nstudio-start-form").getByLabel("Bedrooms").locator("option").count(),6,"all supported BHK inputs are available on landing page");
    assert.equal(await page.locator(".nstudio-feature-copy a[href=\"/design-studio/visualizer\"]").count(),1,"colour studio is discoverable");
    assert.ok(await page.locator(".nstudio-landing").evaluate(el=>el.scrollWidth<=innerWidth+2),"studio landing must not overflow horizontally");
    assert.ok(await page.locator(".nstudio-landing figure figcaption").evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).position==="static")),"image text belongs below the image");
    await page.getByRole("button",{name:"150 gaj",exact:true}).click();assert.equal(await page.getByLabel("Plot width (feet)").inputValue(),"27");assert.equal(await page.getByLabel("Plot depth (feet)").inputValue(),"50");
    await page.getByText("Smart plot calculator · find a missing side",{exact:true}).click();await page.getByLabel("Plot area",{exact:true}).fill("180");await page.getByRole("button",{name:"Apply depth",exact:true}).click();assert.equal(await page.getByLabel("Plot depth (feet)").inputValue(),"60");
    await page.locator(".nstudio-start-form input").nth(0).fill("18");
    await page.locator(".nstudio-start-form input").nth(1).fill("50");
    await page.getByRole("button",{name:/Create room layouts/}).click();
    await page.waitForURL("**/design-studio/portfolio?**");
    assert.match(new URL(page.url()).search,/width=18/);
    await page.goto(base+"/materials/plumbing/cpvc-pipe-25mm",{waitUntil:"load"});
    assert.equal(await page.locator(".product-gallery-caption").count(),1,"gallery has a single truthful caption below the photo");
    assert.equal(await page.locator(".product-gallery-stage .catalog-image-note").count(),0,"no duplicate overlaid labels in product photo");
    assert.equal(await page.locator(".city-select").count(),0,"header does not show a fake location picker");
    // CPVC has no identity-reviewed manufacturer photo yet. Do not require
    // unrelated generic pipe images to satisfy the gallery regression.
    const cpvcStage=page.locator(".product-gallery-stage");
    if(await cpvcStage.locator("img").count()===0){
      assert.match(await page.locator(".product-gallery-caption").innerText(),/Product specifications/);
      assert.equal(await page.locator(".product-gallery-thumbs button").count(),0);
    }else{
      assert.ok(await cpvcStage.locator("img").getAttribute("alt"),"CPVC photo has a meaningful description");
    }
    // The approved 20 mm aggregate family has two distinct bundled photos.
    // Keep the real multi-view gallery test, including local decoding.
    await page.goto(base+"/materials/aggregates/gitti-20mm",{waitUntil:"load"});
    const hero=page.locator(".product-gallery-stage img");
    await hero.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const img=document.querySelector(".product-gallery-stage img");return !!img&&img.complete&&img.naturalWidth>0&&new URL(img.currentSrc).origin===location.origin;},null,{timeout:15000});
    const photoThumbs=page.locator(".product-gallery-thumbs button");
    assert.ok(await photoThumbs.count()>=2,"catalog product has distinct locally cached material photo views");
    const firstHeroSource=await page.locator(".product-gallery-stage img").getAttribute("src");
    await photoThumbs.nth(1).click();
    assert.notEqual(await page.locator(".product-gallery-stage img").getAttribute("src"),firstHeroSource,"second thumbnail displays different image");
    await page.waitForFunction(()=>{const img=document.querySelector(".product-gallery-stage img");return !!img&&img.complete&&img.naturalWidth>0&&new URL(img.currentSrc).origin===location.origin;},null,{timeout:15000});
    await page.getByRole("button",{name:"View large photo",exact:true}).click();
    const large=page.getByRole("dialog",{name:/Large photo of/});
    await large.waitFor({state:"visible"});
    const largeImage=large.locator(".product-photo-dialog-stage img");
    await largeImage.evaluate(img=>img.decode());
    assert.ok(await largeImage.evaluate(img=>img.naturalWidth>0&&new URL(img.currentSrc).origin===location.origin),"large photo uses local decoded media");
    const previousLarge=await largeImage.getAttribute("src");
    await large.getByRole("button",{name:"Next large photo"}).click();
    assert.notEqual(await largeImage.getAttribute("src"),previousLarge,"large viewer follows selected photograph");
    await page.keyboard.press("Escape");
    await large.waitFor({state:"hidden"});
    await page.goto(base+"/materials/cement/ppc-cement-50kg",{waitUntil:"load"});
    const pack=page.locator(".product-gallery-stage img");
    // load does not guarantee deferred/lazy product images have decoded on mobile.
    // Wait for the actual first-party image to finish rather than sleeping or
    // switching the whole page to networkidle (which can hang on long polling).
    await pack.scrollIntoViewIfNeeded();
    await pack.evaluate(async img=>{if(!img.complete)await img.decode().catch(()=>undefined);});
    await page.waitForFunction(()=>{
      const img=document.querySelector(".product-gallery-stage img");
      return !!img&&img.complete&&img.naturalWidth>0;
    },null,{timeout:15000});
    assert.ok(await pack.evaluate(img=>img.complete&&img.naturalWidth>0&&new URL(img.currentSrc).origin===location.origin),"pack photo must load locally");
    await page.goto(base+"/design-studio/fit",{waitUntil:"load"});
    const floorsSelect=page.locator("#nfit-floors");
    assert.equal(await floorsSelect.count(),1,"plot-fit page must render a labelled floors selector");
    await page.locator(".nfit-floor-tabs button").nth(1).click();
    assert.equal(await page.locator(".nfit-primary-next .nroad-diagram").getAttribute("data-selected-floor"),"1","fit preview follows upper-floor selection");
    await page.locator(".nfit-floor-tabs button").nth(0).click();
    assert.equal(await page.locator(".nfit-primary-next .nroad-diagram").getAttribute("data-selected-floor"),"0","fit preview returns to ground floor");
    await floorsSelect.selectOption("1");
    assert.equal(await floorsSelect.inputValue(),"1","ground-floor selection must update the plot brief");
    await page.getByRole("img",{name:/Road on N side/}).waitFor();
    const fitDrawing=page.locator(".nfit-primary-next .nroad-diagram");
    // Verify the room programme independently of display text and tooltip markup.
    await page.waitForFunction(()=>{const d=document.querySelector(".nfit-primary-next .nroad-diagram");return d?.getAttribute("data-selected-floor")==="0"&&d.getAttribute("data-total-bedrooms")==="2"&&d.getAttribute("data-bedroom-count")==="2"});
    const fitBedrooms=fitDrawing.locator('svg g[data-room-kind="bedroom"]');
    assert.equal(await fitBedrooms.count(),2,"ground-floor 2 BHK must contain exactly two actual bedroom geometries");
    assert.equal(await fitDrawing.locator('svg g[data-room-kind="living"]').count()>=1,true,"hall geometry is required");
    assert.equal(await fitDrawing.locator('svg g[data-room-kind="kitchen"]').count(),1,"kitchen geometry is required");
    const roomLabels=await fitBedrooms.locator('text[data-room-label="true"]').allTextContents();
    assert.deepEqual(roomLabels.sort(),["BEDROOM 1","BEDROOM 2"],"visible room labels must match their actual bedroom geometry");
    assert.equal(await fitBedrooms.locator(":scope > title").count(),2,"each bedroom retains its independent descriptive tooltip");
    const cat=await page.goto(base+"/materials/steel",{waitUntil:"load"});
    assert.equal(cat?.status(),200,"steel category route");
    const details=await page.goto(base+"/materials/steel/fe-500d-tmt-12mm",{waitUntil:"load"});
    assert.equal(details?.status(),200,"specific material detail route");
    await page.getByText("Planning a project? Save to material list",{exact:true}).click();
    const add=page.getByRole("button",{name:"Add to material list"});
    assert.equal(await add.count(),1,"a product must provide an actionable add button");
    await add.click();
    const listLink=page.getByRole("link",{name:/Review material list/});
    assert.equal(await listLink.count(),1,"added item must link to the existing planning list");
    await listLink.click();
    await page.waitForURL("**/basket?view=planner",{timeout:15000});
    await page.getByText(/TMT bar.*12 mm/).first().waitFor({timeout:10000});
    const prepareQuote=page.getByRole("link",{name:/Prepare dealer quote/});
    await prepareQuote.waitFor({timeout:15000});
    assert.match((await prepareQuote.getAttribute("href"))??"",/^\/quotes\?/,"list quote link should target quote preparation");
    // Exercise catalog quick-add and quantity stepper without opening product details.
    await page.goto(base+"/materials/cement",{waitUntil:"load"});
    const quickAdd=page.locator(".nb-shop-control").first();
    await quickAdd.getByRole("button",{name:/^Add(?: \d+)?$/}).click();
    await quickAdd.getByRole("button",{name:/Increase /}).click();
    assert.equal(await quickAdd.locator("input[type=number]").inputValue(),"2");
    await quickAdd.getByRole("button",{name:/Decrease /}).click();
    await quickAdd.getByRole("button",{name:/Decrease /}).click();
    await quickAdd.getByRole("button",{name:"Add",exact:true}).waitFor();
    // Real brick route: bulk count, not bags, and valid arbitrary integer quantity.
    await page.goto(base+"/materials/bricks-blocks/red-clay-brick",{waitUntil:"load"});
    const brickConfig=page.locator(".product-request-config");
    assert.equal(await brickConfig.locator("select").first().inputValue(),"piece");
    assert.equal(await brickConfig.locator("input[type=number]").inputValue(),"100");
    assert.deepEqual(await brickConfig.locator("select").first().locator("option").evaluateAll(options=>options.map(o=>o.value)),["piece","bundle","truck"]);
    await brickConfig.locator("input[type=number]").fill("1.5");
    assert.ok(await brickConfig.getByRole("button",{name:"Add to cart",exact:true}).isDisabled());
    await brickConfig.locator("input[type=number]").fill("750");
    await brickConfig.getByRole("button",{name:"Add to cart",exact:true}).click();
    await page.goto(base+"/checkout?cart=1",{waitUntil:"load"});
    const brickCart=page.locator(".nb-shop-cart-line").first();
    assert.equal(await brickCart.locator("input[type=number]").inputValue(),"750");
    await brickCart.getByRole("button",{name:/Increase /}).click();
    assert.equal(await brickCart.locator("input[type=number]").inputValue(),"850");
    await brickCart.getByRole("button",{name:/^Remove /}).click();
    await page.getByText(/Your cart is empty/).waitFor();
    // Exercise a genuine guest order-cart journey, without creating a production order.
    await page.goto(base+"/materials/cement/ppc-cement-50kg",{waitUntil:"load"});
    await page.locator(".product-request-config input[type=number]").fill("3");
    await page.getByRole("button",{name:"Add to cart",exact:true}).click();
    await page.goto(base+"/materials/steel/fe-500d-tmt-12mm",{waitUntil:"load"});
    await page.getByRole("button",{name:"Add to cart",exact:true}).click();
    await page.locator(".nb-shop-floating").click();
    await page.getByRole("heading",{name:"My cart (2)"}).waitFor();
    const firstCart=page.locator(".nb-shop-cart-line").first();
    await firstCart.locator("input[type=number]").fill("5");
    await firstCart.locator("input[type=number]").blur();
    await page.reload({waitUntil:"load"});
    await page.getByRole("heading",{name:"My cart (2)"}).waitFor();
    assert.equal(await page.locator(".nb-shop-cart-line input[type=number]").first().inputValue(),"5","quantity persists after reload");
    await page.getByRole("button",{name:"Continue to delivery →"}).click();
    const signIn=page.getByRole("link",{name:/Sign in and continue/});
    await signIn.waitFor();
    assert.equal(new URL(await signIn.getAttribute("href"),base).searchParams.get("next"),"/checkout?cart=1","cart survives the sign-in return");
    await page.getByRole("heading",{name:"Delivery details",exact:true}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Sign in to submit request"}).isDisabled(),true,"guest can prepare but not submit without authorization");
    await page.getByLabel("Contact name",{exact:true}).fill("Guest draft");
    await page.getByText("Need help or a copy of your request?",{exact:true}).click();
    await page.getByRole("heading",{name:"Keep your material request"}).waitFor();
    await page.getByRole("button",{name:"Download draft",exact:true}).waitFor();
    assert.equal(await signIn.getAttribute("target"),"_blank","sign in preserves original form tab");

    await page.getByRole("button",{name:/Edit cart/}).click();
    await page.locator(".nb-shop-cart-line").last().getByRole("button",{name:/^Remove /}).click();
    await page.getByRole("heading",{name:"My cart (1)"}).waitFor();
    await page.locator(".nb-shop-cart-line").first().getByRole("button",{name:/^Remove /}).click();
    await page.getByText(/Your cart is empty/).waitFor();
    await page.goto(base+"/build-iq",{waitUntil:"load"});
    await page.goto(base+"/build-iq#build-workbench-title",{waitUntil:"load"});
    await page.getByRole("heading",{name:"Calculate the next job."}).waitFor();
    await page.getByRole("button",{name:"Smart Construction & Materials"}).click();
    const coreInput=page.getByLabel("Wall length (ft)",{exact:true});
    await coreInput.fill("17");
    await page.getByRole("button",{name:"Smart Plot & Design"}).click();
    await page.getByRole("button",{name:"Smart Construction & Materials"}).click();
    assert.equal(await coreInput.inputValue(),"17","construction measurements survive workspace switches");
  await page.getByRole("button",{name:"House budget",exact:true}).click();
  assert.equal(await page.getByLabel("Your quoted rate (₹/sq ft)").inputValue(),"","no assumed market rate");
  await page.getByText("Budget is optional.",{exact:false}).waitFor();
  await page.getByRole("button",{name:"Brick wall",exact:true}).click();
    await page.getByRole("button",{name:"Smart Plot & Design"}).click();
    const converter=page.locator(".quick-calculators .calculator-page-card");
    await converter.waitFor({state:"visible"});
    await converter.getByRole("combobox",{name:"Unit",exact:true}).selectOption("m");
    assert.ok(Math.abs(Number(await converter.getByLabel("Length",{exact:true}).inputValue())-6.096)<1e-8,"changing units preserves length");
    assert.match(await converter.locator(".area-results").innerText(),/800/);
    await page.getByRole("button",{name:"Smart Construction & Materials"}).click();
    await page.getByLabel("What do you want to calculate?").selectOption("tiles");
    const tileWidth=page.getByLabel("Tile width (mm)",{exact:true});
    await tileWidth.fill("0");
    assert.equal(await tileWidth.getAttribute("aria-invalid"),"true");
    await tileWidth.fill("600");
    assert.equal(await tileWidth.getAttribute("aria-invalid"),"false");
    assert.match(await page.locator(".quick-calculators > .build-lab-grid .build-results").innerText(),/29 tiles/);
    await page.getByRole("button",{name:"Save as baseline",exact:true}).click();
    await tileWidth.fill("300");
    assert.match(await page.locator(".calc-compare").innerText(),/Session baseline: 29 tiles/);
    await page.getByRole("button",{name:"Restore baseline inputs",exact:true}).click();
    assert.equal(await tileWidth.inputValue(),"600");
    await page.getByRole("button",{name:"View estimate report",exact:true}).click();
    assert.match(await page.getByLabel("Estimate report (select and copy)").inputValue(),/calculation model v1/);
    await page.getByRole("button",{name:"Close report",exact:true}).click();
    const academyCount=await page.locator("#academy-lesson-list > a").count();
    assert.ok(academyCount>=19,"construction and foundational knowledge lessons are available");
    await page.getByRole("searchbox",{name:"Search the construction handbook"}).fill("foundation");
    await page.getByRole("link",{name:"Soil, foundations & underground",exact:true}).click();
    await page.getByRole("checkbox").first().check();
    await page.reload({waitUntil:"load"});
    await page.waitForFunction(()=>document.querySelector(".handbook-checks input")?.checked===true);
    await page.goto(base+"/build-iq",{waitUntil:"load"});
    await page.getByRole("link",{name:"Understand the full lesson →"}).click();
    await page.getByText("Quick knowledge check",{exact:true}).waitFor();
    await page.getByRole("button",{name:"Compare their measured dimensions and road access"}).click();
    await page.getByText("That's right.",{exact:true}).waitFor();
    await page.getByRole("button",{name:"Mark lesson explored"}).click();
    await page.reload({waitUntil:"load"});
    await page.getByRole("button",{name:"Lesson explored ✓"}).waitFor();
    await page.getByRole("link",{name:"All lessons",exact:true}).click();
    await page.locator(".academy-progress").getByText(`1 of ${academyCount} lessons explored`,{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("neerva-academy-v1")).completed.includes("spatial-thinking")),true,"the explored lesson persists on this device");
    await page.getByRole("searchbox",{name:"Search construction questions"}).fill("सरिया");
    assert.ok(await page.locator(".knowledge-answers details").count()>=2,"Hindi search returns site answers");
    await page.getByRole("button",{name:"हिंदी",exact:true}).click();
    await page.getByText("1000 वर्ग फीट में कितना सरिया लगेगा?",{exact:true}).waitFor();
    await page.goto(base+"/build-iq/site-practice",{waitUntil:"load"});
    await page.getByRole("searchbox",{name:"Search site situations"}).fill("ईंट");
    await page.getByRole("button",{name:"80",exact:true}).click();
    await page.getByText("Good decision.",{exact:true}).waitFor();
    await page.getByRole("heading",{name:"Recognise honeycombing in concrete"}).waitFor();
    assert.equal(await page.getByRole("heading",{name:"Compare two written material prices"}).count(),0,"purchase calculators are not in Academy");
    await page.goto(base+"/my-project",{waitUntil:"load"});
    await page.getByText("Optional: compare material prices & deliveries",{exact:true}).click();
    await page.getByText(/Supplier B is ₹500 lower/).waitFor();
    await page.getByLabel("Rejected or damaged units").fill("50");
    await page.getByText("Total accepted shortfall",{exact:true}).locator("..").getByText("100",{exact:true}).waitFor();
    await page.goto(base+"/learn/future-homes",{waitUntil:"load"});
    const future=page.locator(".future-architecture-item");
    assert.equal(await future.count(),6,"six separate future architecture concepts");
    for(const img of await future.locator("img").all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());assert.ok(await img.evaluate(el=>el.naturalWidth===600&&el.loading==="lazy"&&el.getAttribute("src").startsWith("/images/knowledge/future/")));}
    assert.ok(await page.locator(".future-architecture").evaluate(el=>el.scrollWidth<=el.clientWidth+1),"future architecture fits the viewport");
    await page.goto(base+"/inspiration",{waitUntil:"load"});
    await page.getByRole("button",{name:"Interiors",exact:true}).click();
    assert.equal(await page.locator(".inspiration-card").count(),4,"interior discovery filter");
    await page.getByRole("button",{name:"Save An open and airy living room"}).click();
    await page.getByRole("button",{name:"Natural sage",exact:true}).click();
    await page.reload({waitUntil:"load"});
    await page.getByRole("button",{name:"My board (1)",exact:true}).first().click();
    assert.equal(await page.locator(".inspiration-card").count(),1,"saved inspiration persists");
    assert.equal(await page.getByRole("button",{name:"Natural sage",exact:true}).getAttribute("aria-pressed"),"true");
    await page.goto(base+"/inspiration?ideas=starter,unknown&palette=earth",{waitUntil:"load"});
    await page.getByRole("button",{name:"Save shared board locally"}).waitFor();
    assert.equal(await page.locator(".inspiration-card").count(),1,"shared board allows only known ideas");
    await page.getByRole("button",{name:"Save shared board locally"}).click();
    await page.getByLabel("New board name").fill("Living room ideas");
    await page.getByRole("button",{name:"Create board",exact:true}).click();
    assert.equal(await page.locator(".inspiration-card").count(),0,"new mood board starts independent");
    await page.getByLabel("Active board").selectOption({label:"My first board"});
    assert.equal(await page.locator(".inspiration-card").count(),1,"original saved board remains intact");
    await page.goto(base+"/room-lab",{waitUntil:"load"});
    await page.getByRole("button",{name:"Edit floor plan",exact:true}).click();
    await page.getByRole("button",{name:/^Sofa/}).click();
    await page.getByRole("button",{name:/^Double bed/}).click();
    assert.equal(await page.locator(".room-lab-preview svg g").count(),2,"furniture added to room");
    await page.reload({waitUntil:"load"});
    await page.getByRole("button",{name:"Edit floor plan",exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll(".room-lab-preview svg g").length===2);
    await page.getByRole("button",{name:"Wall #f1e7d5",exact:true}).click();
    assert.equal(await page.getByRole("button",{name:"Wall #f1e7d5",exact:true}).getAttribute("aria-pressed"),"true");
    await page.getByLabel("Name your design").fill("First layout");
    await page.getByRole("button",{name:"Save design",exact:true}).click();
    await page.getByRole("button",{name:"Restore First layout",exact:true}).waitFor();
    await page.getByRole("button",{name:"Wall #dbe4d1",exact:true}).click();
    await page.getByRole("button",{name:"Restore First layout",exact:true}).click();
    assert.equal(await page.getByRole("button",{name:"Wall #f1e7d5",exact:true}).getAttribute("aria-pressed"),"true","saved room restores its finish");
    await page.getByRole("button",{name:"Interactive 3D",exact:true}).click();
    await page.getByRole("button",{name:"Evening",exact:true}).click();
    assert.equal(await page.getByRole("button",{name:"Evening",exact:true}).getAttribute("aria-pressed"),"true");
    await page.getByRole("button",{name:"Edit floor plan",exact:true}).click();
    assert.equal(await page.locator(".room-lab-preview svg g").count(),2,"3D and floor plan use same furniture state");
    await page.goto(base+"/my-project",{waitUntil:"load"});
    await page.getByRole("button",{name:/02 Foundation/}).click();
    await page.getByRole("checkbox",{name:"Confirm structural quantities"}).check();
    await page.getByLabel("Planned budget (₹)").fill("500000");
    await page.getByLabel("Amount already spent (₹)").fill("120000");
    await page.reload({waitUntil:"load"});
    await page.getByRole("checkbox",{name:"Confirm structural quantities"}).waitFor();
    assert.ok(await page.getByRole("checkbox",{name:"Confirm structural quantities"}).isChecked(),"project checklist survives reload");
    assert.equal(await page.getByLabel("Planned budget (₹)").inputValue(),"500000","local budget survives reload");
    assert.equal(await page.getByRole("link",{name:/Prepare material request/}).getAttribute("href"),"/quotes","project connects to existing guarded quote workflow");
    await verifyColourStudio(page,base);
    // Tested road-correct 18x50 PlanModel: one source for geometry, 3D and paint quantities.
    // A gallery deep link must choose the SAME plan for both 2D geometry and 3D.
    await page.goto(base+"/design-studio/portfolio?width=18&depth=50&road=N&floors=2&bedrooms=3&parking=true&option=5",{waitUntil:"load"});
    const chosenLayout=page.locator(".nroad-variants button[aria-pressed=true]");
    await chosenLayout.first().waitFor({state:"visible",timeout:20000});
    assert.equal(await chosenLayout.count(),1,"exactly one linked gallery option selected");
    assert.match((await chosenLayout.locator("strong").innerText()),/^6\./,"gallery card #6 opens option #6, not the default plan");
    assert.equal(await page.locator(".nbd-building").count(),0,"3D does not mount before the visitor reaches it");
    await page.getByRole("button",{name:"Ground floor"}).click();
    await page.locator(".nroad-3d-slot").scrollIntoViewIfNeeded();
    await page.getByRole("button",{name:"Selected floor cutaway"}).waitFor({timeout:30000});
    const modelFirst=await page.locator(".nbd-building").evaluate(el=>{const canvas=el.querySelector(".nbd-webgl"),mode=el.querySelector(".nbd-mode-controls");return !canvas||!!mode&&canvas.compareDocumentPosition(mode)&Node.DOCUMENT_POSITION_FOLLOWING});
    assert.ok(modelFirst,"model appears before its display controls");
    assert.equal(await page.getByRole("button",{name:"Selected floor cutaway"}).getAttribute("aria-pressed"),"true","ground-floor 3D defaults to matching floor");
    // The 3D mesh source must change with the actual selected 2D option, not only the highlighted card.
    const plan2D=page.locator(".nroad-diagram"),plan3D=page.locator(".nbd-building");
    await plan3D.waitFor();
    const sixthId=await plan2D.getAttribute("data-plan-id");
    assert.ok(sixthId,"2D must expose its exact source model");
    assert.equal(await plan3D.getAttribute("data-plan-id"),sixthId,"3D must use the same PlanModel as selected 2D");
    assert.equal(await plan2D.getAttribute("data-selected-floor"),"0");
    const viewerBounds=await plan3D.evaluate(viewer=>{
      const buttons=[...viewer.querySelectorAll(".nbd-buttons button")].filter(button=>button.getClientRects().length>0&&button.getBoundingClientRect().height>0);
      const viewport=document.documentElement.clientWidth;
      const visual=viewer.querySelector("canvas, svg")?.getBoundingClientRect();
      return {fits:visual&&visual.left>=0&&visual.right<=viewport+1,
        targets:buttons.map(button=>button.getBoundingClientRect().height)};
    });
    assert.ok(viewerBounds.fits,"hydrated 3D preview fits the page");
    assert.ok(viewerBounds.targets.length>=3&&viewerBounds.targets.every(height=>height>=44),"visible 3D modes have full touch targets");
    const qualityOptions=plan3D.locator(".nbd-quality-options");
    if(await qualityOptions.count()){
      assert.equal(await qualityOptions.getAttribute("open"),null,"advanced quality is initially collapsed");
      await qualityOptions.locator("summary").click();
      const qualityTargets=await qualityOptions.getByRole("group",{name:"3D rendering quality"}).locator("button").evaluateAll(buttons=>buttons.map(button=>button.getBoundingClientRect().height));
      assert.equal(qualityTargets.length,2,"both rendering quality choices remain available");
      assert.ok(qualityTargets.every(height=>height>=44),"expanded quality controls have full touch targets");
      await qualityOptions.locator("summary").click();
    }
    assert.equal(await plan3D.getAttribute("data-selected-floor"),"0","3D cutaway must start on the selected ground floor");
    assert.ok(Number(await plan3D.getAttribute("data-wall-cells"))>0,"3D selected floor must contain actual mesh walls");
    const airControls=page.locator("fieldset.nroad-air-controls");assert.equal(await airControls.getByRole("checkbox").count(),2);
    assert.ok(await airControls.evaluate(el=>{const boxes=[...el.querySelectorAll(".nroad-air-choice")].map(x=>x.getBoundingClientRect());return boxes.length===2&&boxes[0].bottom<=boxes[1].top+1&&boxes.every(b=>b.left>=0&&b.right<=document.documentElement.clientWidth+1&&b.height>=44)}),"ventilation choices are structured touch targets");
    const sameAir=()=>page.waitForFunction(()=>{const a=document.querySelector(".nroad-diagram"),b=document.querySelector(".nbd-building");return !!a&&!!b&&a.getAttribute("data-plan-id")===b.getAttribute("data-plan-id")&&a.getAttribute("data-ventilation-windows")===b.getAttribute("data-ventilation-windows")&&a.getAttribute("data-roof-jaal")===b.getAttribute("data-roof-jaal")});
    await sameAir();await airControls.getByRole("checkbox").first().check();await sameAir();await airControls.getByRole("checkbox").nth(1).check();await sameAir();
    // Assert the actual modeled state, not translatable prose. An infeasible
    // shaft must never be reported as modeled or offered a fake roof camera.
    const roofStatus=await plan2D.getAttribute("data-roof-jaal");
    const shaftStatus=airControls.locator(".nroad-air-status");
    const roofCamera=plan3D.getByRole("button",{name:"See roof jaal from above",exact:true});
    const findShaft=airControls.getByRole("button",{name:"Find a layout with roof jaal",exact:true});
    assert.ok(["modeled","not-modeled"].includes(roofStatus),"2D reports an explicit roof state");
    assert.equal(await plan3D.getAttribute("data-roof-jaal"),roofStatus);
    assert.equal(await shaftStatus.getAttribute("data-shaft-state"),roofStatus==="modeled"?"modeled":"unavailable");
    if(roofStatus==="modeled"){
      assert.equal(await roofCamera.isVisible(),true);assert.equal(await findShaft.count(),0);
    }else{
      assert.equal(await roofCamera.count(),0);assert.equal(await findShaft.isEnabled(),true);
      // The 18×50 G+1 benchmark has a feasible alternative. Exercise recovery
      // and require synchronized modeled geometry before restoring option #6.
      await findShaft.click();
      await page.waitForFunction(()=>document.querySelector(".nroad-air-status")?.getAttribute("data-shaft-state")==="modeled",{},{timeout:120000});
      await sameAir();
      assert.equal(await plan2D.getAttribute("data-roof-jaal"),"modeled");assert.equal(await roofCamera.isVisible(),true);
      await page.locator(".nroad-variants button").nth(5).click();await sameAir();
      assert.equal(await plan2D.getAttribute("data-plan-id"),sixthId);
    }
    await plan3D.getByRole("button",{name:"Highlight ventilation in 3D",exact:true}).click();assert.equal(await plan3D.getByRole("button",{name:"Hide ventilation highlights",exact:true}).getAttribute("aria-pressed"),"true");
    await plan3D.getByRole("button",{name:"Hide ventilation highlights",exact:true}).click();await airControls.getByRole("checkbox").nth(1).uncheck();await airControls.getByRole("checkbox").first().uncheck();await sameAir();await page.getByRole("button",{name:"Selected floor cutaway",exact:true}).click();
    await plan2D.screenshot({path:path.join("test-results/mobile","390-residential-2d.png"),animations:"disabled"});
    const comparisonCanvas=plan3D.locator(".nbd-webgl canvas");
    if(await comparisonCanvas.count()&&await comparisonCanvas.isVisible()){
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     await comparisonCanvas.screenshot({path:path.join("test-results/mobile","390-residential-cutaway.png"),animations:"disabled"});
     const gpuHost=plan3D.locator(".nbd-webgl");
     const gpuSample=async()=>{await gpuHost.locator("canvas").waitFor({state:"visible"});await page.waitForFunction(()=>!!document.querySelector(".nbd-webgl")?.getAttribute("data-gpu-resources"));return JSON.parse(await gpuHost.getAttribute("data-gpu-resources"));};
     const before=await gpuSample();
     for(let cycle=0;cycle<3;cycle++){
      await plan3D.getByRole("button",{name:"Full exterior · all floors",exact:true}).click();await gpuSample();
      await plan3D.getByRole("button",{name:"Selected floor cutaway",exact:true}).click();await gpuSample();
     }
     const after=await gpuSample();
     assert.equal(after.geometries,before.geometries,"identical cutaway must not accumulate geometry allocations");
     assert.equal(after.textures,before.textures,"identical cutaway must not accumulate texture allocations");
     assert.ok(before.canvasPixels>0&&before.drawCalls>0&&before.triangles>0);
     assert.equal(await gpuHost.locator("canvas").count(),1,"no duplicate WebGL canvas after switches");
     architectureReports.push({purpose:"residential",mode:"cutaway",renderer:"webgl",planId:sixthId,before,after,scope:"Three.js resource counts and first CPU submission, not GPU memory bytes",...await comparisonCanvas.evaluate(el=>({width:el.width,height:el.height}))});
    }else architectureReports.push({purpose:"residential",mode:"cutaway",renderer:"not-verified",planId:sixthId});
    await page.locator(".nroad-variants button").first().click();
    await page.waitForFunction(previous=>{
      const a=document.querySelector(".nroad-diagram"),b=document.querySelector(".nbd-building");
      return !!a&&!!b&&a.getAttribute("data-plan-id")!==previous
        &&a.getAttribute("data-plan-id")===b.getAttribute("data-plan-id");
    },sixthId);
    await page.getByRole("button",{name:"First floor"}).click();
    await page.waitForFunction(()=>{
      const a=document.querySelector(".nroad-diagram"),b=document.querySelector(".nbd-building");
      return !!a&&!!b&&a.getAttribute("data-selected-floor")==="1"
        &&b.getAttribute("data-selected-floor")==="1"&&Number(b.getAttribute("data-wall-cells"))>0;
    });
    await page.getByRole("button",{name:"Full-height floor",exact:true}).click();
    assert.equal(await plan3D.getAttribute("data-selected-floor"),"1","full-height view preserves selected floor");
    await page.getByRole("button",{name:"Full exterior · all floors"}).click();
    assert.equal(await plan3D.getAttribute("data-selected-floor"),"all","full exterior intentionally displays both floors");
    await page.getByRole("button",{name:"Selected floor cutaway"}).click();
    assert.equal(await plan3D.getAttribute("data-selected-floor"),"1","return to cutaway follows the same 2D floor");
    await page.locator("details.nroad-shortlist-panel > summary").click();
    await page.getByRole("button",{name:"Save selected layout locally",exact:true}).click();
    await page.locator(".nroad-variants button").nth(5).click();
    await page.getByRole("button",{name:"Save selected layout locally",exact:true}).click();
    await page.getByRole("button",{name:"Show shortlist (2)",exact:true}).click();
    await page.locator(".nroad-shortlist-choices input").nth(0).check();
    await page.locator(".nroad-shortlist-choices input").nth(1).check();
    assert.equal(await page.locator(".nroad-compare-grid article").count(),2,"compare two real plans");
    assert.equal(await page.locator(".nbd-building").count(),1,"comparison must not allocate extra WebGL viewers");
    const comparedIds=await page.locator(".nroad-compare-grid .nroad-diagram").evaluateAll(els=>els.map(e=>e.getAttribute("data-plan-id")));
    assert.equal(new Set(comparedIds).size,2,"comparison has distinct geometry sources");
    await page.getByRole("button",{name:"Hide shortlist (2)",exact:true}).click();
    await page.goto(base+"/design-studio/road-planner",{waitUntil:"load"});
    const roadPlan=page.getByRole("img",{name:/Road on N side/});
    await roadPlan.waitFor({state:"visible",timeout:15000});
    assert.equal(await roadPlan.count(),1,"road-side marker should be visible on 2D");
    {const cards=page.locator(".nroad-variants button");const count=await cards.count();assert.ok(count>=24&&count<=38,"24 baseline options plus feasible upper-floor alternatives");
    const ids=await cards.evaluateAll(nodes=>nodes.map(node=>node.getAttribute("data-plan-id")));assert.equal(new Set(ids).size,count,"No duplicated plan IDs");}
    assert.ok((await page.locator(".nroad-variants button").first().locator(".nroad-mini-plan").count())>=1,"every option has real floor previews");
    const streetButton=page.getByRole("button",{name:"Open realistic street render",exact:true});
    await streetButton.click();
    const street=page.getByRole("region",{name:"Plan-matched realistic street preview"});
    await street.waitFor({state:"visible"});
    assert.equal(await street.getAttribute("data-plan-id"),await page.locator(".nroad-plan-summary").getAttribute("data-plan-id"));
    await street.getByRole("button",{name:"Straight front",exact:true}).click();
    assert.equal(await street.getByRole("button",{name:"Straight front",exact:true}).getAttribute("aria-pressed"),"true");
    await street.getByRole("button",{name:"Evening",exact:true}).click();
    assert.equal(await street.getByRole("button",{name:"Evening",exact:true}).getAttribute("aria-pressed"),"true");
    await street.getByText("Render this house from the street",{exact:true}).click();
    const renderStarted=Date.now();await street.getByRole("button",{name:"Generate realistic image",exact:true}).click();
    await street.getByRole("button",{name:"Save render (PNG)",exact:true}).waitFor({timeout:95000});
    const rendered=street.locator("canvas");
    const pixelStats=await rendered.evaluate(el=>{const pixels=el.getContext("2d").getImageData(0,0,el.width,el.height).data;const rgb=new Set();for(let i=0;i<pixels.length;i+=4)rgb.add(pixels[i]*65536+pixels[i+1]*256+pixels[i+2]);return {width:el.width,height:el.height,colours:rgb.size};});
    assert.ok(pixelStats.width>0&&pixelStats.height>0&&pixelStats.colours>30,"street worker returns a genuine nonblank render");
    await rendered.screenshot({path:path.join("test-results/mobile","390-residential-street-raytrace.png"),animations:"disabled"});
    architectureReports.push({purpose:"residential",mode:"street-evening",renderer:"worker-raytrace",planId:await street.getAttribute("data-plan-id"),elapsedMs:Date.now()-renderStarted,...pixelStats});
    await page.getByRole("button",{name:/Parking right/}).first().click();
    assert.equal(await page.getByRole("button",{name:/Parking right/}).first().getAttribute("aria-pressed"),"true");
    const floorToggle=page.getByRole("button",{name:"First floor"});
    await floorToggle.click();
    assert.equal(await floorToggle.getAttribute("aria-pressed"),"true","G+1 levels must switch");
    const roadSelector=page.locator(".nroad-form").getByRole("combobox",{name:"Road along which edge?",exact:true});
    await roadSelector.selectOption("E");
    assert.equal(await page.getByRole("img",{name:/Road on E side/}).count(),1,"east-side road is still the entry edge");
    const plotInputs=page.locator(".nroad-controls input[type=number]");
    await plotInputs.nth(0).fill("15");
    await plotInputs.nth(1).fill("30");
    assert.equal(await page.getByRole("alert").getByText(/No circulation-safe plan/).count(),1,
      "15×30 3BHK parking request must not receive a fake plan");
    await page.screenshot({path:path.join("test-results/mobile","390-road-planner-impossible-15x30.png"),fullPage:true,animations:"disabled"});
    await plotInputs.nth(0).fill("18");
    await plotInputs.nth(1).fill("50");
    await page.getByRole("img",{name:/Road on E side/}).waitFor();
    await page.screenshot({path:path.join("test-results/mobile","390-road-planner-18x50.png"),fullPage:true,animations:"disabled"});
    await page.goto(base+"/design-studio/portfolio?width=18&depth=50&floors=2&bedrooms=1&road=N&parking=true",{waitUntil:"load"});
    const floorSelector=page.locator(".nroad-form").getByRole("combobox",{name:"Levels",exact:true});
    await floorSelector.waitFor({state:"visible"});
    assert.equal(await floorSelector.inputValue(),"2","G+1 is preserved for one bedroom");
    await page.getByRole("img",{name:/Road on N side/}).waitFor();
    assert.equal(await page.locator(".nroad-error").count(),0,"G+1 1 BHK must not be rejected merely for having two floors");
    assert.match(await page.locator(".nroad-plan-summary").innerText(),/1\s*Bedrooms total/);
    await page.getByRole("button",{name:"First floor",exact:true}).click();
    assert.match(await page.locator(".nroad-plan-summary").innerText(),/0\s*Bedrooms on this floor/);
    await page.getByRole("button",{name:"Ground floor",exact:true}).click();
    assert.match(await page.locator(".nroad-plan-summary").innerText(),/1\s*Bedrooms on this floor/);
    await page.goto(base+"/design-studio/portfolio?width=18&depth=50&floors=1&bedrooms=1&road=N&parking=false",{waitUntil:"load"});
    await page.getByRole("img",{name:/Road on N side/}).waitFor();
    assert.equal(await page.locator(".nroad-variants button").count(),14,"standard plot has fourteen geometry-validated 1 BHK choices");
    await page.locator(".nroad-variants button").last().click();
    assert.equal(await page.locator(".nroad-variants button").last().getAttribute("aria-pressed"),"true");
    assert.match(await page.locator(".nroad-selection-feedback").innerText(),/Layout 14 of 14 selected/);
    await page.locator(".nroad-3d-slot").scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const a=document.querySelector(".nroad-diagram"),b=document.querySelector(".nbd-building");return !!a&&!!b&&a.getAttribute("data-plan-id")===b.getAttribute("data-plan-id")});
    await page.goto(base+"/design-studio/portfolio?width=15&depth=30&floors=1&bedrooms=1&road=W&parking=false",{waitUntil:"load"});
    await page.getByRole("img",{name:/Road on W side/}).waitFor();
    assert.equal(await page.locator(".nroad-variants button").count(),10,"compact 1 BHK has ten validated room allocations and orientations");
    const compactFirstId=await page.locator(".nroad-diagram").getAttribute("data-plan-id");
    await page.locator(".nroad-variants button").last().click();
    assert.equal(await page.locator(".nroad-variants button").last().getAttribute("aria-pressed"),"true");
    await page.locator(".nroad-3d-slot").scrollIntoViewIfNeeded();
    await page.waitForFunction(previous=>{
      const a=document.querySelector(".nroad-diagram"),b=document.querySelector(".nbd-building");
      return !!a&&!!b&&a.getAttribute("data-plan-id")!==previous
        &&a.getAttribute("data-plan-id")===b.getAttribute("data-plan-id");
    },compactFirstId);
    assert.equal(await page.getByRole("button",{name:"First floor"}).count(),0);
    await page.getByRole("button",{name:"Selected floor cutaway"}).waitFor();
    // Actual render worker integration; a WebGL fallback must not advertise a working renderer.
    const liveCanvas=page.locator(".nbd-webgl canvas");
    if(await liveCanvas.count()){
     const renderPanel=page.getByRole("region",{name:"Browser architectural rendering"});
     await renderPanel.locator("summary").click();
     await renderPanel.getByRole("button",{name:"Generate realistic image"}).click();
     await renderPanel.getByRole("button",{name:"Cancel render"}).click();
     await renderPanel.getByText(/Rendering cancelled/).waitFor();
     await renderPanel.getByRole("button",{name:"Generate realistic image"}).click();
     await renderPanel.getByRole("button",{name:"Save render (PNG)"}).waitFor({timeout:95000});
     const output=renderPanel.locator("canvas");
     assert.ok(await output.evaluate(c=>{const data=c.getContext("2d").getImageData(0,0,c.width,c.height).data;return c.width>=16&&c.height>=16&&data.some((v,i)=>i%4!==3&&v>10)&&data.some((v,i)=>i%4!==3&&v<220)}),"ray-traced output contains actual nonblank pixels");
     await output.screenshot({path:path.join("test-results/mobile","390-browser-ray-traced-architecture.png")});
    }else assert.equal(await page.getByRole("region",{name:"Browser architectural rendering"}).count(),0,"unsupported device retains the existing plan fallback");
    // Large-home input, full 24-option gallery and the exact selected 3D floor.
    await page.goto(base+"/design-studio/portfolio?width=36&depth=65&floors=2&bedrooms=6&road=W&parking=true",{waitUntil:"load"});
    await page.getByRole("img",{name:/Road on W side/}).waitFor();
    assert.equal(await page.locator(".nroad-variants button").count(),24,"six-bedroom brief retains its existing validated portfolio");
    assert.match(await page.locator(".nroad-plan-summary").innerText(),/6\s*Bedrooms total/);
    const firstLargeId=await page.locator(".nroad-diagram").getAttribute("data-plan-id");
    await page.locator(".nroad-variants button").last().click();
    await page.getByRole("button",{name:"First floor",exact:true}).click();
    await page.locator(".nroad-3d-slot").scrollIntoViewIfNeeded();
    await page.waitForFunction(previous=>{const a=document.querySelector(".nroad-diagram"),b=document.querySelector(".nbd-building");return !!a&&!!b&&a.getAttribute("data-plan-id")!==previous&&a.getAttribute("data-plan-id")===b.getAttribute("data-plan-id")&&b.getAttribute("data-selected-floor")==="1"},firstLargeId);
    await page.goto(base+"/design-studio/portfolio?width=15&depth=30&floors=2&bedrooms=6&road=N&parking=true",{waitUntil:"load"});
    assert.equal(await page.locator(".nroad-form").getByRole("combobox",{name:"Total bedrooms",exact:true}).inputValue(),"6");
    await page.locator(".nroad-error").waitFor();
    assert.equal(await page.locator(".nroad-variants button").count(),0,"Impossible brief must not show fabricated layouts");
    // Cross-BHK regression matrix: every requested bedroom must exist as a
    // visible, dimensioned room in the selected 2D plan and the same 3D source.
    for(const [bedrooms,width,depth,levels,road,parking] of [
      [1,18,50,1,"N",false],[2,20,40,1,"E",true],[3,18,50,2,"S",true],
      [4,36,65,2,"W",true],[5,36,65,2,"N",true],[6,36,65,2,"E",true]
    ]){
      await page.goto(base+"/design-studio/portfolio?"+new URLSearchParams({width,depth,floors:levels,bedrooms,road,parking}),{waitUntil:"load"});
      const drawing=page.locator(".nroad-diagram").first();
      await drawing.waitFor({state:"visible"});
      const selectedId=await drawing.getAttribute("data-plan-id");
      assert.ok(selectedId,bedrooms+" BHK has a valid source plan");
      const cards=page.locator(".nroad-variants button");
      assert.ok(await cards.count()>0,bedrooms+" BHK has real layout choices");
      assert.equal(await cards.first().locator(".nroad-mini-plan").count(),levels,"all levels shown in each option");
      await page.locator(".nroad-3d-slot").scrollIntoViewIfNeeded();
      const viewer=page.locator(".nbd-building");
      await viewer.waitFor({state:"visible",timeout:30000});
      let total=0,halls=0,kitchens=0;const roomIds=[];
      for(let floor=0;floor<levels;floor++){
        await page.getByRole("group",{name:"Select floor"}).getByRole("button",{name:["Ground floor","First floor","Second floor"][floor],exact:true}).click();
        await page.waitForFunction(({id,floor})=>{const a=document.querySelector(".nroad-diagram"),b=document.querySelector(".nbd-building");return a?.getAttribute("data-plan-id")===id&&b?.getAttribute("data-plan-id")===id&&a.getAttribute("data-selected-floor")===String(floor)&&b.getAttribute("data-selected-floor")===String(floor)&&Number(b.getAttribute("data-wall-cells"))>0},{id:selectedId,floor});
        const bedroomRooms=drawing.locator('svg g[data-room-kind="bedroom"]');
        const data=await bedroomRooms.evaluateAll(rooms=>rooms.map(room=>{const r=room.querySelector("rect"),label=room.querySelector('text[data-room-label="true"]');return {id:room.getAttribute("data-room-id"),w:Number(r?.getAttribute("width")),h:Number(r?.getAttribute("height")),label:label?.textContent}}));
        assert.ok(data.every(r=>r.id&&r.w>0&&r.h>0&&r.label),bedrooms+" BHK must show each bedroom label and dimensions");
        assert.equal(Number(await drawing.getAttribute("data-bedroom-count")),data.length);
        assert.equal(Number(await drawing.getAttribute("data-total-bedrooms")),bedrooms);
        total+=data.length;roomIds.push(...data.map(r=>r.id));
        halls+=await drawing.locator('svg g[data-room-kind="living"]').count();
        kitchens+=await drawing.locator('svg g[data-room-kind="kitchen"]').count();
      }
      assert.equal(total,bedrooms,"exact bedroom count across all floors");
      assert.equal(new Set(roomIds).size,bedrooms,"no duplicate bedroom IDs across floors");
      assert.ok(halls>=1&&kitchens>=1,"BHK must contain living room and kitchen");
      console.log("BHK browser matrix verified:",bedrooms,levels,road,total);
    }
    // Home construction comparison and arbitrary plot-size journey.
    await page.goto(base+"/",{waitUntil:"load"});
    assert.equal(await page.locator(".nbh-quick-quote").count(),1,"materials-first homepage needs itemised quote draft");
     assert.equal(await page.locator(".nbh-shopping-shelf,.nbh-quick-categories,.nbh-shop-product").count(),0,"no duplicate materials shelf");
     const categories=page.locator(".nbh-category-grid");
     assert.equal(await categories.locator(".nbh-material-card").count(),9,"original nine categories retained");
     assert.equal(await categories.locator(".nbh-category-cart").count(),await categories.locator(".nbh-material-card").count(),"every existing category has a catalog-backed action");
     assert.ok(await categories.evaluate(el=>el.scrollWidth<=el.clientWidth+2),"category grid fits mobile");
     const nav=page.locator(".nbh-mobile-shop-nav");
     assert.equal(await nav.locator("a").count(),5);
     assert.ok(await nav.isVisible(),"mobile navigation is visible");
     const navRoutes=await nav.locator("a").evaluateAll(links=>links.map(a=>a.getAttribute("href")));
     for(const href of navRoutes){const response=await page.request.get(base+href);assert.equal(response.status(),200,"mobile tab route "+href);}
     const homeCartBefore=await page.locator(".nbh-cart-icon").getAttribute("aria-label");
     const card=categories.locator(".nbh-material-card").filter({has:page.locator(".nbh-category-cart-product").filter({hasText:/Ultratech PPC Cement/i})});
     assert.equal(await card.count(),1,"one exact cement product quick-add");
     await card.locator("button.nb-shop-add").click();
     await page.waitForFunction(before=>document.querySelector(".nbh-cart-icon")?.getAttribute("aria-label")!==before,homeCartBefore);
     await card.locator(".nb-shop-stepper").waitFor({state:"visible"});
     await nav.locator('a[href="/checkout?cart=1"]').click();
     await page.getByRole("heading",{name:"My cart (1)"}).waitFor();
     assert.match(await page.locator(".nb-shop-cart-line").first().innerText(),/Ultratech PPC Cement/i);
     await page.reload({waitUntil:"load"});
     await page.getByRole("heading",{name:"My cart (1)"}).waitFor();
     await page.locator(".nb-shop-cart-line").first().getByRole("button",{name:/^Remove /}).click();
     await page.getByText(/Your cart is empty/).waitFor();
     await page.goto(base+"/",{waitUntil:"load"});
     assert.equal(await page.locator(".nbh-explore-grid a").count(),6,"all six discovery tools preserved");
     assert.equal(await page.locator(".nbh-photo-hero img").count(),1,"licensed real-house hero replaces old animation");
     assert.equal(await page.locator(".home-stage-comparison img").count(),2,"paired construction-stage renders");
     const comparisonGeometry=await page.locator(".nbh-compare-frame").evaluate(el=>{const r=el.getBoundingClientRect();return {ratio:r.width/r.height,fit:[...el.querySelectorAll("img")].map(img=>getComputedStyle(img).objectFit)}});
     assert.ok(Math.abs(comparisonGeometry.ratio-3)<.08,"centered facade crop removes peripheral context");
     assert.ok(comparisonGeometry.fit.every(f=>f==="contain"),"both comparison images must share the same centered crop");
     const stage=page.locator(".home-stage-comparison"),slider=stage.getByRole("slider");await stage.getByRole("button",{name:"Under construction",exact:true}).click();assert.equal(await slider.inputValue(),"100");await stage.getByRole("button",{name:"Finished home",exact:true}).click();assert.equal(await slider.inputValue(),"0");await stage.getByRole("button",{name:"Compare",exact:true}).click();assert.equal(await slider.inputValue(),"50");assert.equal(await stage.locator("a").count(),0,"no duplicate material links below comparison");assert.ok(await page.locator(".nbh-category-grid a[href=\"/materials/bricks-blocks\"]").count()>0,"material navigation preserved in category grid");
     const cardRows=await categories.locator(".nbh-material-card").evaluateAll(cards=>cards.slice(0,2).map(card=>{const add=card.querySelector(".nb-shop-add"),product=card.querySelector(".nbh-category-cart-product"),options=card.querySelector(".nbh-material-options"),rect=add?.getBoundingClientRect();return {top:rect?.top,productBottom:product?.getBoundingClientRect().bottom,optionsBottom:options?.getBoundingClientRect().bottom,productTop:product?.getBoundingClientRect().top}}));
     if(cardRows.every(r=>r.top!=null)&&await page.evaluate(()=>CSS.supports("grid-template-rows","subgrid")&&innerWidth>350)){assert.ok(Math.abs(cardRows[0].top-cardRows[1].top)<3,"adjacent cart actions align");}

    assert.equal(await page.getByRole("button",{name:/Replay illustration/}).count(),0,"do not fabricate manual state before dragging");
    assert.equal(await page.locator(".home-stage-comparison").count(),1,"construction stages replace static colour mood");
    const quick=page.locator(".nbh-quick-quote");await quick.locator("select[name=category]").selectOption("cement");assert.equal(await quick.locator("input[name=quantity]").getAttribute("step"),"1");
    await quick.locator("select[name=category]").selectOption("steel");
    assert.match(await quick.locator("input[name=material]").getAttribute("placeholder"),/TMT/);
    assert.equal(await quick.locator("select[name=unit]").inputValue(),"kg");
    await quick.locator("input[name=material]").fill("TMT 12 mm");
    await quick.locator("input[name=quantity]").fill("25");
    await quick.locator("input[name=pincode]").fill("208001");
    const quickHref=new URL(base+"/quotes?"+new URLSearchParams({category:"steel",material:"TMT 12 mm",quantity:"25",pincode:"208001",city:"Kanpur"}));
    const prefill=await page.request.get(quickHref.href);
    assert.equal(prefill.status(),200,"quote prefill is routed, never submitted as order");
    const resultHtml=await prefill.text();
    assert.match(resultHtml,/TMT 12 mm/,"draft material preserved");
    await quick.locator("input[name=city]").fill("Kanpur");
    await quick.locator("button[type=submit]").click();
    await page.waitForURL("**/quotes?**");
    assert.equal(await page.locator("input[name=materialDescription]").inputValue(),"TMT 12 mm");
    assert.equal(await page.locator("select[name=unit]").inputValue(),"kg");
    await page.goto(base+"/",{waitUntil:"load"});
    const newCatalog=await page.request.get(base+"/materials/paint");
    assert.equal(newCatalog.status(),200,"new paint category exists");
    const reveal=page.getByRole("slider",{name:/construction-stage/});
    await reveal.focus();await reveal.press("End");assert.equal(await reveal.inputValue(),"100");
    await reveal.press("Home");assert.equal(await reveal.inputValue(),"0");
    const preset=page.locator("#nbh-studio-preset");
    assert.equal(await preset.count(),1,"home uses a single accessible plot-size picker");
    assert.equal(await page.locator(".nbh-studio-progress li[aria-current=step]").count(),1,"plot planner exposes its current step");
    assert.equal(await page.locator(".nbh-studio-progress li").count(),2,"both planning steps visible");
    assert.ok(await page.locator(".nbh-studio-planner").evaluate(el=>el.scrollWidth<=el.clientWidth+2),"plot planner must fit the viewport");
    assert.equal(await preset.inputValue(),"18x50","default selection matches the displayed plot and generated plan");
    assert.equal(await page.locator(".nbh-studio-photo img").count(),1,"only one independent inspiration photo is shown in the planner");
    await preset.selectOption("custom");
    const dimensions=page.locator(".nbh-studio-custom-fields input[type=number]");
    assert.equal(await dimensions.count(),2,"custom plotting accepts both frontage and depth");
    await dimensions.nth(0).fill("9");
    assert.ok(await page.locator(".nbh-studio-generate").isDisabled(),"invalid plot cannot continue");
    assert.ok(await page.locator(".nbh-studio-step-button").nth(1).isDisabled(),"invalid plot cannot bypass step 2");
    for(const [w,d] of [["18","50"],["20","45"]]){
      await dimensions.nth(0).fill(w);await dimensions.nth(1).fill(d);
      await page.locator(".nbh-studio-step-button").nth(1).click();
      assert.equal(new URL(page.url()).pathname,"/","room requirements stay inside homepage");
      assert.equal(await page.locator(".nbh-studio-progress li").nth(1).getAttribute("aria-current"),"step");
      assert.ok(await page.locator(".nbh-studio-generate").isDisabled(),"explicit household choices required");
      await page.locator("#nbh-studio-bedrooms").selectOption("2");await page.locator("#nbh-studio-parking").selectOption("false");
      const link=page.locator(".nbh-studio-generate[href]");const href=await link.getAttribute("href");
      assert.ok(href?.includes("width="+w+"&depth="+d));assert.ok(href?.includes("floors=2&road=N&bedrooms=2&parking=false"));
      await page.locator(".nbh-studio-back").click();assert.equal(await dimensions.nth(0).inputValue(),w);assert.equal(await dimensions.nth(1).inputValue(),d);
      await page.locator(".nbh-studio-generate").click();assert.equal(await page.locator("#nbh-studio-bedrooms").inputValue(),"2");assert.equal(await page.locator("#nbh-studio-parking").inputValue(),"false");
      await link.click();await page.waitForURL("**/design-studio/portfolio?**");await page.locator(".nroad-form").waitFor({state:"visible"});
      assert.equal(await page.locator(".nroad-form").getByRole("combobox",{name:"Total bedrooms",exact:true}).inputValue(),"2");assert.equal(await page.locator(".nroad-form").getByRole("combobox",{name:"Car parking",exact:true}).inputValue(),"false");
      assert.equal(await page.locator("summary").filter({hasText:/Coordinated design|China and seismic/}).count(),0,"no unrelated educational banner above planner");
      await page.goto(base+"/",{waitUntil:"load"});await page.locator("#nbh-studio-preset").selectOption("custom");
    }
    await page.locator("#nbh-studio-preset").selectOption("30x40");
    const roadOptions=page.locator(".nbh-studio-options");assert.equal(await roadOptions.locator("legend").count(),1);
    await roadOptions.locator("#nbh-studio-floors").selectOption("3");await roadOptions.locator("#nbh-studio-road").selectOption("W");
    await page.locator(".nbh-studio-generate").click();await page.locator("#nbh-studio-bedrooms").selectOption("3");await page.locator("#nbh-studio-parking").selectOption("true");
    assert.match((await page.locator(".nbh-studio-generate[href]").getAttribute("href"))??"",/width=30&depth=40&floors=3&road=W&bedrooms=3&parking=true/);


   }
   await page.goto(base+"/",{waitUntil:"load"});
   const mainLink=page.locator(".nbh-journey.nbh-primary[href='/materials']").first();
   if(await mainLink.count()){
     const box=await mainLink.boundingBox();
     if(box&&box.height<44)failures.push(v.w+"px: primary material CTA smaller than 44px");
   }else failures.push(v.w+"px: primary materials CTA missing");
   assert.equal(await page.locator(".nbh-material-card").count(),9,"home must show nine construction material categories");
   if(errors.length)failures.push(v.w+"px browser errors: "+errors.join(" | ").slice(0,1200));
   await ctx.close();
  }
  const req=await browser.newContext();
  // Negative authorization checks for EVERY protected role API and exposed verb.
  // These are guest-only probes; none may persist an order, payment, offer or role change.
  const protectedMatrix={
   GET:["/api/admin/marketplace-readiness","/api/admin/catalog/campaigns","/api/admin/catalog","/api/admin/fulfilment",
    "/api/admin/orders","/api/admin/pricing","/api/admin/rfqs",
    "/api/admin/studio-payments","/api/admin/studio-settings","/api/admin/studio-support",
    "/api/admin/system-incidents","/api/admin/users","/api/customer/quotes",
    "/api/dealer/inventory","/api/dealer/quotes","/api/dealer/orders","/api/orders","/api/direct-orders",
    "/api/studio/payments","/api/studio/projects","/api/studio/support"],
   POST:["/api/admin/catalog/campaigns","/api/admin/catalog","/api/admin/pricing",
    "/api/admin/rfqs","/api/admin/users","/api/dealer/inventory","/api/dealer/quotes",
    "/api/orders","/api/direct-orders","/api/rfqs","/api/studio/payments","/api/studio/payments/claim",
    "/api/studio/premium-report","/api/studio/projects","/api/studio/support"],
   PATCH:["/api/admin/catalog/campaigns","/api/admin/catalog","/api/admin/fulfilment",
    "/api/admin/pricing","/api/admin/studio-payments","/api/admin/studio-settings",
    "/api/admin/studio-support","/api/admin/users","/api/admin/orders","/api/dealer/orders","/api/orders","/api/direct-orders"],
   DELETE:["/api/studio/payments"]
  };
  for(const [method,routes] of Object.entries(protectedMatrix)){
   for(const route of routes){
    const res=await req.request.fetch(base+route,{
     method,
     ...(method==="GET"?{}:{headers:{"Content-Type":"application/json"},data:{}})
    });
    if(![401,403,503].includes(res.status()))failures.push(method+" "+route+" failed closed-authorization contract: "+res.status());
   }
  }
  for(const route of ["/api/catalog","/api/catalog/prices","/api/catalog/offers","/api/studio/config"]){
   const res=await req.request.get(base+route);
   if(![200,503].includes(res.status()))failures.push("Public API "+route+" unexpected status "+res.status());
  }
  const securityHeaders=(await req.request.get(base+"/")).headers();
  for(const [key,value] of Object.entries({"x-content-type-options":"nosniff","x-frame-options":"DENY","x-permitted-cross-domain-policies":"none"})){if(securityHeaders[key]!==value)failures.push("Security header missing or invalid: "+key);}
  if(!securityHeaders["content-security-policy"]?.includes("frame-ancestors 'none'"))failures.push("Clickjacking CSP protection missing");
  const missingCity=await req.request.get(base+"/api/studio/city-rules");
  if(missingCity.status()!==400)failures.push("City rules must reject requests lacking a supported city, received "+missingCity.status());
  const cityRules=await req.request.get(base+"/api/studio/city-rules?city=Kanpur");
  if(![200,503].includes(cityRules.status()))failures.push("City rules for Kanpur returned "+cityRules.status());
  await req.close();
 }finally{await browser.close()}
 fs.writeFileSync("test-results/mobile/architecture-visual-evidence.json",JSON.stringify({scope:"Actual local browser screenshots and renderer availability; not a subjective realism rating or real-device result",samples:architectureReports},null,2));
 fs.writeFileSync("test-results/mobile/interaction-baseline.json",JSON.stringify({scope:"Visible controls on tested routes; inline text links may legitimately be smaller. Protected actions are not executed by this inventory.",samples:interactionReports},null,2));
 fs.writeFileSync("test-results/mobile/performance-baseline.json",JSON.stringify({scope:"390px local browser observations; no field INP claim or cross-run comparison",samples:performanceReports},null,2));
 fs.writeFileSync("test-results/mobile/accessibility-baseline.json",JSON.stringify({
  scope:"Automated axe-core WCAG 2.x A/AA sample at 390px; NOT a full manual WCAG certificate.",
  sampled:accessibilityReports,criticalOrSerious:accessibilityReports.flatMap(r=>("violations" in r?r.violations:[])).filter(v=>["critical","serious"].includes(v.impact??"")).length
 },null,2));
 if(failures.length){console.error("Mobile regression failed:\n"+failures.join("\n"));process.exitCode=1}
 else console.log("Mobile browser smoke: five viewports, private RFQ API denial and privacy-first PWA, material-to-quote navigation, editable colour preview, custom 18×50/20×45 plot massing, construction reveal, no browser errors, protected API denials.");
}
main().catch(error=>{console.error(error);process.exitCode=1});

