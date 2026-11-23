/* Minimal mobile browser gate: no external telemetry, no credentials, no fake metrics. */
import {chromium} from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const base=process.env.SMOKE_BASE_URL||"http://127.0.0.1:3000";
const views=[{w:360,h:800},{w:390,h:844},{w:430,h:932},{w:768,h:1024},{w:1440,h:900}];
const routes=["/","/design-studio","/design-studio/library","/design-studio/fit","/design-studio/visualizer","/design-studio/workbench","/design-studio/road-planner","/design-studio/portfolio","/materials","/basket","/quotes","/install","/account","/terms","/returns"];
async function main(){
 fs.mkdirSync("test-results/mobile",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
 const failures=[],accessibilityReports=[];
 try{
  for(const v of views){
   const ctx=await browser.newContext({viewport:{width:v.w,height:v.h},deviceScaleFactor:1,isMobile:v.w<=430,hasTouch:v.w<=430});
   const page=await ctx.newPage(),errors=[];
   page.on("pageerror",error=>errors.push("uncaught at "+new URL(page.url()).pathname+": "+error.message));
   page.on("console",message=>{if(message.type()==="error")errors.push("console at "+new URL(page.url()).pathname+": "+message.text().slice(0,180))});
   for(const route of routes){
    const res=await page.goto(base+route,{waitUntil:"networkidle",timeout:40000});
    assert.equal(res?.status(),200,"HTTP "+route+" at "+v.w+"px");
    const issues=await page.evaluate(()=>{
     const root=document.documentElement,body=document.body;
     const contentWidth=Math.max(root.scrollWidth,body.scrollWidth);
     return{width:innerWidth,contentWidth,h1:document.querySelectorAll("h1").length,title:document.title,lang:root.lang};
    });
    if(issues.contentWidth>issues.width+2)failures.push(v.w+"px "+route+": horizontal overflow "+(issues.contentWidth-issues.width)+"px");
    if(!issues.title)failures.push(v.w+"px "+route+": missing document title");
    if(!issues.lang)failures.push(v.w+"px "+route+": missing document language");
    if(issues.h1<1)failures.push(v.w+"px "+route+": missing main heading");
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
    // PWA is installable without storing private pages or fabricating offline orders.
    const manifest=await page.request.get(base+"/manifest.webmanifest");
    assert.equal(manifest.status(),200,"manifest route");
    const appManifest=await manifest.json();
    assert.equal(appManifest.name?.includes("NEERVA BUILD"),true,"PWA name");
    assert.ok(appManifest.icons?.some(icon=>icon.purpose?.includes("maskable")),"PWA maskable icon");
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
    await page.goto(base+"/install",{waitUntil:"networkidle"});
    assert.equal(await page.getByRole("heading",{name:"Install on this device"}).count(),1,"dedicated install page displays actual browser action");
    assert.equal(await page.locator(".neerva-install-banner").count(),0,"no duplicate global banner on install instructions");
    await page.evaluate(()=>{
      const event=new Event("beforeinstallprompt",{cancelable:true});
      Object.assign(event,{prompt:async()=>undefined,userChoice:Promise.resolve({outcome:"accepted"})});
      window.dispatchEvent(event);
    });
    assert.equal(await page.getByRole("button",{name:"Install NEERVA BUILD now"}).count(),1,"real install-event listener must display browser prompt action");
    await page.getByRole("button",{name:"Install NEERVA BUILD now"}).click();
    await page.getByText("Installation was accepted. Check your home screen.").waitFor();
    const account=await page.goto(base+"/account",{waitUntil:"networkidle"});
    assert.equal(account?.status(),200,"authenticated account route");
    assert.equal(await page.getByRole("heading",{name:/Access your projects and requests/}).count(),1,"account page must not show prelaunch placeholder");
    if(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY){
      assert.equal(await page.getByRole("button",{name:"Sign in"}).count(),1,"account form requires configured Supabase credentials");
    }else{
      assert.equal(await page.getByText("Waiting for backend setup").count(),1,"unconfigured account must not collect passwords");
    }
    const unauth=await page.request.post(base+"/api/rfqs",{data:{idempotencyKey:"f1d3068d-3f5f-4e5c-a14e-2546fb9902ed"}});
    const expectedUnauth=process.env.NEERVA_RFQ_INTAKE_ENABLED==="true"&&process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?401:503;
    assert.equal(unauth.status(),expectedUnauth,"RFQ must fail closed: 401 only when intake and auth are enabled, otherwise 503");
    await page.goto(base+"/",{waitUntil:"networkidle"});
    assert.equal(await page.locator(".neerva-install-banner").count(),1,"discoverable installation help is available on first visit without scroll");
     assert.equal(await page.getByRole("button",{name:/How to install|Install app/}).count(),1,"browser-specific install help entry is usable");
     await page.locator(".neerva-install-banner").getByRole("button",{name:"Not now"}).click();
     assert.equal(await page.locator(".neerva-install-banner").count(),0,"install assistance dismisses cleanly");
    // Authenticated role isolation needs live fixture accounts and cannot be simulated by guest screenshots.
    for(const roleRoute of ["/account/quotes","/dealer/quotes","/admin/catalog"]){
      const response=await page.goto(base+roleRoute,{waitUntil:"networkidle"});
      assert.equal(response?.status(),200,roleRoute+" public route shell");
      await page.screenshot({path:path.join("test-results/mobile","390-role-"+roleRoute.replaceAll("/","-")+".png"),fullPage:true,animations:"disabled"});
    }
    // No real install API, so no fake installation success is emitted by smoke tests.
   }
   if(v.w===390){
    // Business-flow smoke: category -> product -> local planning list -> quote.
    await page.goto(base+"/quotes",{waitUntil:"networkidle"});
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
    await page.goto(base+"/design-studio",{waitUntil:"networkidle"});
    assert.equal(await page.locator(".nstudio-start-form").count(),1,"home studio must start with plot fields, not an unscaled static concept");
    await page.locator(".nstudio-start-form input").nth(0).fill("18");
    await page.locator(".nstudio-start-form input").nth(1).fill("50");
    await page.getByRole("button",{name:/Create room layouts/}).click();
    await page.waitForURL("**/design-studio/portfolio?**");
    assert.match(new URL(page.url()).search,/width=18/);
    await page.goto(base+"/materials/cement/ppc-cement-50kg",{waitUntil:"networkidle"});
    const pack=page.locator(".product-gallery-stage img");
    assert.ok(await pack.evaluate(img=>img.complete&&img.naturalWidth>0&&new URL(img.currentSrc).origin===location.origin),"pack photo must load locally");
    await page.goto(base+"/design-studio/fit",{waitUntil:"networkidle"});
    await page.getByLabel("Floors",{exact:true}).selectOption("1");
    await page.getByRole("img",{name:/Road on N side/}).waitFor();
    assert.equal(await page.locator(".nroad-diagram svg").getByText("BEDROOM 2",{exact:true}).count(),1);
    const cat=await page.goto(base+"/materials/steel",{waitUntil:"networkidle"});
    assert.equal(cat?.status(),200,"steel category route");
    const details=await page.goto(base+"/materials/steel/fe-500d-tmt-12mm",{waitUntil:"networkidle"});
    assert.equal(details?.status(),200,"specific material detail route");
    const add=page.getByRole("button",{name:"Add to material list"});
    assert.equal(await add.count(),1,"a product must provide an actionable add button");
    await add.click();
    const listLink=page.getByRole("link",{name:/Review material list/});
    assert.equal(await listLink.count(),1,"added item must link to the existing planning list");
    await listLink.click();
    await page.waitForURL("**/basket",{timeout:15000});
    await page.getByText(/TMT bar.*12 mm/).first().waitFor({timeout:10000});
    const prepareQuote=page.getByRole("link",{name:/Prepare dealer quote/});
    await prepareQuote.waitFor({timeout:15000});
    assert.match((await prepareQuote.getAttribute("href"))??"",/^\/quotes\?/,"list quote link should target quote preparation");
    const visual=await page.goto(base+"/design-studio/visualizer",{waitUntil:"networkidle"});
    assert.equal(visual?.status(),200,"colour editor route");
    const photo=page.getByRole("button",{name:"Use my home photo"});
    const exterior=page.getByRole("button",{name:"Explore exterior concept"});
    assert.equal(await photo.getAttribute("aria-pressed"),"true","real-photo editor must be default");
    await exterior.click();
    assert.equal(await exterior.getAttribute("aria-pressed"),"true","original concept remains available");
    await photo.click();
    assert.equal(await photo.getAttribute("aria-pressed"),"true","photo editor resumes without a reload");
 await page.getByRole("button",{name:"Try a furnished living room"}).click();
 const canvas=page.locator(".nbd-photo canvas");
 await canvas.waitFor({state:"visible"});await canvas.scrollIntoViewIfNeeded();
 async function mark(x){let b=await canvas.boundingBox();for(const [u,v] of [[x,.12],[x+.12,.12],[x+.12,.26],[x,.26]])await canvas.click({position:{x:u*b.width,y:v*b.height}});}
 await mark(.06);
 await page.getByLabel("Wall design").selectOption("bands");
 await page.getByRole("button",{name:"Keep wall & select another"}).click();
 await mark(.56);await page.getByRole("button",{name:"Double panels",exact:true}).click();
 const png=()=>canvas.evaluate(c=>c.toDataURL());
 const combo=await png();await page.getByRole("button",{name:"View original"}).click();assert.notEqual(await png(),combo);
 await page.getByRole("button",{name:"Show new colour"}).click();assert.equal(await png(),combo);
 const download=page.waitForEvent("download");await page.getByRole("button",{name:"Save colour preview"}).click();assert.match((await download).suggestedFilename(),/png$/);
    // Tested road-correct 18x50 PlanModel: one source for geometry, 3D and paint quantities.
    await page.goto(base+"/design-studio/road-planner",{waitUntil:"networkidle"});
    const roadPlan=page.getByRole("img",{name:/Road on N side/});
    assert.equal(await roadPlan.count(),1,"road-side marker should be visible on 2D");
    assert.equal(await page.locator(".nroad-variants button").count(),24,"supported exact-plot 24 checked architectural variations");
    await page.getByRole("button",{name:/Car at right/}).first().click();
    assert.equal(await page.getByRole("button",{name:/Car at right/}).first().getAttribute("aria-pressed"),"true");
    const floorToggle=page.getByRole("button",{name:"First floor"});
    await floorToggle.click();
    assert.equal(await floorToggle.getAttribute("aria-pressed"),"true","G+1 levels must switch");
    const roadSelector=page.getByLabel("Road along which edge?");
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
    // Home construction comparison and arbitrary plot-size journey.
    await page.goto(base+"/",{waitUntil:"networkidle"});
    assert.equal(await page.locator(".nbh-quick-quote").count(),1,"materials-first homepage needs itemised quote draft");
     assert.equal(await page.locator(".nbh-photo-hero img").count(),1,"licensed real-house hero replaces old animation");
     assert.equal(await page.locator(".nbh-real-construction img").count(),2,"construction and completed home use separate editorial photos");
    assert.equal(await page.getByRole("button",{name:/Replay illustration/}).count(),0,"do not fabricate manual state before dragging");
    assert.equal(await page.locator(".nbh-build-visual").count(),1,"construction stages replace static colour mood");
    const quick=page.locator(".nbh-quick-quote");
    await quick.locator("select[name=category]").selectOption("steel");
    await quick.locator("input[name=material]").fill("TMT 12 mm");
    await quick.locator("input[name=quantity]").fill("25");
    await quick.locator("input[name=pincode]").fill("208001");
    const quickHref=new URL(base+"/quotes?"+new URLSearchParams({category:"steel",material:"TMT 12 mm",quantity:"25",pincode:"208001",city:"Kanpur"}));
    const prefill=await page.request.get(quickHref.href);
    assert.equal(prefill.status(),200,"quote prefill is routed, never submitted as order");
    const resultHtml=await prefill.text();
    assert.match(resultHtml,/TMT 12 mm/,"draft material preserved");
    const newCatalog=await page.request.get(base+"/materials/paint");
    assert.equal(newCatalog.status(),200,"new paint category exists");
    assert.equal(await page.getByRole("slider",{name:/construction-stage/}).count(),0,"real-photo panels must not pretend to be a single building before/after slider");
    assert.equal(await page.locator(".nbh-real-construction img").count(),2,"show actual editorial construction and completed home photos");
    assert.equal(await page.getByText(/STRUCTURE \/ WORK SITE/).count(),1,"construction photo must be labelled");
    assert.equal(await page.getByText(/COMPLETED HOME STYLE/).count(),1,"completed home reference must be labelled");
    assert.equal(await page.getByText(/different properties/).count()>0,true,"do not claim two unrelated photographs are the same project");
    const dimensions=page.locator(".nbh-filter-row input[type=number]");
    assert.equal(await dimensions.count(),2,"home must support arbitrary plot width and depth");
    for(const [w,d] of [["18","50"],["20","45"]]){
      await dimensions.nth(0).fill(w);
      await dimensions.nth(1).fill(d);
      const link=page.getByRole("link",{name:/Open detailed plot fit/});
      assert.match((await link.getAttribute("href"))??"",new RegExp("width="+w+"&depth="+d),"plot dimensions need to persist into fit flow");
      await link.click();
      await page.waitForURL("**/design-studio/fit?**");
      const next=page.getByRole("link",{name:/Explore floors, front elevation/});
      await page.getByRole("img",{name:/Road on N side/}).waitFor();
      await page.waitForFunction(([w,d])=>document.querySelector(".nfit-primary-next a")?.href.includes("width="+w+"&depth="+d),[w,d]);
      assert.ok(await next.isVisible());
      await page.goto(base+"/",{waitUntil:"networkidle"});
    }

   }
   await page.goto(base+"/",{waitUntil:"networkidle"});
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
  const a=await req.request.get(base+"/api/orders");
  if(![401,503].includes(a.status()))failures.push("Unauthenticated order API must fail closed; observed "+a.status());
  for(const route of ["/api/customer/quotes","/api/dealer/inventory","/api/admin/users"]) {
   const response=await req.request.get(base+route);
   if(![401,403,503].includes(response.status()))failures.push("Unauthenticated protected "+route+" must fail closed; observed "+response.status());
  }
  await req.close();
 }finally{await browser.close()}
 fs.writeFileSync("test-results/mobile/accessibility-baseline.json",JSON.stringify({
  scope:"Automated axe-core WCAG 2.x A/AA sample at 390px; NOT a full manual WCAG certificate.",
  sampled:accessibilityReports,criticalOrSerious:accessibilityReports.flatMap(r=>("violations" in r?r.violations:[])).filter(v=>["critical","serious"].includes(v.impact??"")).length
 },null,2));
 if(failures.length){console.error("Mobile regression failed:\n"+failures.join("\n"));process.exitCode=1}
 else console.log("Mobile browser smoke: five viewports, private RFQ API denial and privacy-first PWA, material-to-quote navigation, editable colour preview, custom 18×50/20×45 plot massing, construction reveal, no browser errors, protected API denials.");
}
main().catch(error=>{console.error(error);process.exitCode=1});
