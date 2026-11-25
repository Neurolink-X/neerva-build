/* Minimal mobile browser gate: no external telemetry, no credentials, no fake metrics. */
import {chromium} from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const base=process.env.SMOKE_BASE_URL||"http://127.0.0.1:3000";
const views=[{w:360,h:800},{w:390,h:844},{w:430,h:932},{w:768,h:1024},{w:1440,h:900}];
const routes=["/","/design-studio","/design-studio/library","/design-studio/fit","/design-studio/visualizer","/design-studio/workbench","/design-studio/road-planner","/design-studio/portfolio","/materials","/basket","/quotes","/install","/account","/terms","/returns","/studio-pricing","/learn","/admin","/admin/orders","/admin/rfqs","/admin/fulfilment","/admin/catalog","/admin/pricing","/admin/marketing","/admin/dealers","/admin/studio-settings","/admin/studio-payments","/admin/studio","/admin/users","/admin/system-health","/admin/audit","/admin/account-recovery","/dealer/dashboard","/dealer/inventory","/dealer/quotes","/dealer/orders"];
async function main(){
 fs.mkdirSync("test-results/mobile",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
 const failures=[],accessibilityReports=[],performanceReports=[];
 try{
  for(const v of views){
   const ctx=await browser.newContext({viewport:{width:v.w,height:v.h},deviceScaleFactor:v.w<=430?2:1,isMobile:v.w<=430,hasTouch:v.w<=430});
   const page=await ctx.newPage(),errors=[];
   if(v.w===390)await page.addInitScript(()=>{
    const metrics={lcp:null,cls:0,sessionStart:0,previousShift:0,sessionScore:0};
    window.__neervaPerf=metrics;
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
    if(v.w===390&&["/","/materials","/design-studio","/design-studio/fit","/design-studio/visualizer"].includes(route)){
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     const timing=await page.evaluate(()=>{const n=performance.getEntriesByType("navigation")[0],m=window.__neervaPerf;return {ttfbMs:n?Math.round(n.responseStart):null,loadMs:n?Math.round(n.loadEventEnd):null,lcpMs:m?.lcp==null?null:Math.round(m.lcp),cls:m?.cls??null};});
     performanceReports.push({route,width:v.w,...timing,scope:"initial load observation, not field Web Vitals"});
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
   if(v.w===390||v.w===1440){
    const sizes=v.w===390?[[320,568],[360,800],[390,844],[412,915],[540,720],[768,1024],[844,390]]:[[1024,768],[1280,720],[1440,900],[1920,1080],[2560,1440]];
    for(const route of ["/design-studio/road-planner","/design-studio/portfolio?width=18&depth=50&road=N&bedrooms=3&floors=2&parking=true"]){
     await page.goto(base+route,{waitUntil:"load"});
     await page.locator(".nbd-building canvas, .nbd-building svg").first().waitFor();
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
      "/support","/privacy","/brands","/business-model","/calculators","/blog",
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
    await page.goto(base+"/install",{waitUntil:"load"});
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
    const account=await page.goto(base+"/account",{waitUntil:"load"});
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
    await page.goto(base+"/",{waitUntil:"load"});
    await page.locator(".neerva-install-banner").waitFor({state:"visible",timeout:15000});
    assert.equal(await page.locator(".neerva-install-banner").count(),1,"discoverable installation help is available on first visit without scroll");
     assert.equal(await page.getByRole("button",{name:/How to install|Install app/}).count(),1,"browser-specific install help entry is usable");
     await page.locator(".neerva-install-banner").getByRole("button",{name:"Not now"}).click();
     assert.equal(await page.locator(".neerva-install-banner").count(),0,"install assistance dismisses cleanly");
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
    await floorsSelect.selectOption("1");
    assert.equal(await floorsSelect.inputValue(),"1","ground-floor selection must update the plot brief");
    await page.getByRole("img",{name:/Road on N side/}).waitFor();
    assert.equal(await page.locator(".nroad-diagram svg").getByText("BEDROOM 2",{exact:true}).count(),1);
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
    await page.waitForURL("**/basket",{timeout:15000});
    await page.getByText(/TMT bar.*12 mm/).first().waitFor({timeout:10000});
    const prepareQuote=page.getByRole("link",{name:/Prepare dealer quote/});
    await prepareQuote.waitFor({timeout:15000});
    assert.match((await prepareQuote.getAttribute("href"))??"",/^\/quotes\?/,"list quote link should target quote preparation");
    // Exercise a genuine guest order-cart journey, without creating a production order.
    await page.goto(base+"/materials/cement/ppc-cement-50kg",{waitUntil:"load"});
    await page.locator(".product-request-config input[type=number]").fill("3");
    await page.getByRole("button",{name:"Add to order cart",exact:true}).click();
    await page.goto(base+"/materials/steel/fe-500d-tmt-12mm",{waitUntil:"load"});
    await page.getByRole("button",{name:"Add to order cart",exact:true}).click();
    await page.getByRole("link",{name:/View order cart/}).click();
    await page.getByRole("heading",{name:"Order cart (2)"}).waitFor();
    const firstCart=page.locator("article.admin-record").first();
    await firstCart.locator("input[name=quantity]").fill("5");
    await firstCart.getByRole("button",{name:"Update quantity"}).click();
    await page.reload({waitUntil:"load"});
    await page.getByRole("heading",{name:"Order cart (2)"}).waitFor();
    assert.equal(await page.locator("article.admin-record input[name=quantity]").first().inputValue(),"5","quantity persists after reload");
    await page.getByRole("button",{name:"Continue to checkout"}).click();
    const signIn=page.getByRole("link",{name:/Sign in and continue/});
    await signIn.waitFor();
    assert.equal(new URL(await signIn.getAttribute("href"),base).searchParams.get("next"),"/checkout?cart=1","cart survives the sign-in return");
    await page.getByRole("button",{name:/Edit cart/}).click();
    await page.locator("article.admin-record").last().getByRole("button",{name:"Remove"}).click();
    await page.getByRole("heading",{name:"Order cart (1)"}).waitFor();
    await page.locator("article.admin-record").first().getByRole("button",{name:"Remove"}).click();
    await page.getByText(/Your order cart is empty/).waitFor();
    const visual=await page.goto(base+"/design-studio/visualizer",{waitUntil:"load"});
    assert.equal(visual?.status(),200,"colour editor route");
    await page.getByRole("button",{name:"Sample house exterior"}).click();
    await page.getByRole("button",{name:"Sample room",exact:true}).click();
 const canvas=page.locator(".nbd-photo canvas");
 await canvas.waitFor({state:"visible"});await canvas.scrollIntoViewIfNeeded();
 async function mark(x){let b=await canvas.boundingBox();for(const [u,v] of [[x,.12],[x+.12,.12],[x+.12,.26],[x,.26]])await canvas.click({position:{x:u*b.width,y:v*b.height}});}
 await page.getByRole("button",{name:/Reset wall selection/}).click();
 await mark(.06);
 await page.getByRole("combobox",{name:"Wall design",exact:true}).selectOption("bands");
 await page.getByRole("button",{name:"Keep wall & select another"}).click();
 await mark(.56);await page.getByRole("button",{name:"Double panels",exact:true}).click();
 const png=()=>canvas.evaluate(c=>c.toDataURL());
 const combo=await png();await page.getByRole("button",{name:"View original"}).click();assert.notEqual(await png(),combo);
 await page.getByRole("button",{name:"Show new colour"}).click();assert.equal(await png(),combo);
 const download=page.waitForEvent("download");await page.getByRole("button",{name:"Save colour preview"}).click();assert.match((await download).suggestedFilename(),/png$/);
    // Tested road-correct 18x50 PlanModel: one source for geometry, 3D and paint quantities.
    // A gallery deep link must choose the SAME plan for both 2D geometry and 3D.
    await page.goto(base+"/design-studio/portfolio?width=18&depth=50&road=N&floors=2&bedrooms=3&parking=true&option=5",{waitUntil:"load"});
    const chosenLayout=page.locator(".nroad-variants button[aria-pressed=true]");
    await chosenLayout.first().waitFor({state:"visible",timeout:20000});
    assert.equal(await chosenLayout.count(),1,"exactly one linked gallery option selected");
    assert.match((await chosenLayout.innerText()),/^6\./,"gallery card #6 opens option #6, not the default plan");
    await page.getByRole("button",{name:"Ground floor"}).click();
    await page.getByRole("button",{name:"Selected floor cutaway"}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Selected floor cutaway"}).getAttribute("aria-pressed"),"true","ground-floor 3D defaults to matching floor");
    // The 3D mesh source must change with the actual selected 2D option, not only the highlighted card.
    const plan2D=page.locator(".nroad-diagram"),plan3D=page.locator(".nbd-building");
    await plan3D.waitFor();
    const sixthId=await plan2D.getAttribute("data-plan-id");
    assert.ok(sixthId,"2D must expose its exact source model");
    assert.equal(await plan3D.getAttribute("data-plan-id"),sixthId,"3D must use the same PlanModel as selected 2D");
    assert.equal(await plan2D.getAttribute("data-selected-floor"),"0");
    const viewerBounds=await plan3D.evaluate(viewer=>{
      const buttons=[...viewer.querySelectorAll(".nbd-buttons button")];
      const viewport=document.documentElement.clientWidth;
      const visual=viewer.querySelector("canvas, svg")?.getBoundingClientRect();
      return {fits:visual&&visual.left>=0&&visual.right<=viewport+1,
        targets:buttons.map(button=>button.getBoundingClientRect().height)};
    });
    assert.ok(viewerBounds.fits,"hydrated 3D preview fits the page");
    assert.ok(viewerBounds.targets.every(height=>height>=44),"3D modes have full touch targets");
    assert.equal(await plan3D.getAttribute("data-selected-floor"),"0","3D cutaway must start on the selected ground floor");
    assert.ok(Number(await plan3D.getAttribute("data-wall-cells"))>0,"3D selected floor must contain actual mesh walls");
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
    await page.getByRole("button",{name:"Full exterior · all floors"}).click();
    assert.equal(await plan3D.getAttribute("data-selected-floor"),"all","full exterior intentionally displays both floors");
    await page.getByRole("button",{name:"Selected floor cutaway"}).click();
    assert.equal(await plan3D.getAttribute("data-selected-floor"),"1","return to cutaway follows the same 2D floor");
    await page.goto(base+"/design-studio/road-planner",{waitUntil:"load"});
    const roadPlan=page.getByRole("img",{name:/Road on N side/});
    await roadPlan.waitFor({state:"visible",timeout:15000});
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
    await page.goto(base+"/design-studio/portfolio?width=15&depth=30&floors=1&bedrooms=1&road=W&parking=false",{waitUntil:"load"});
    await page.getByRole("img",{name:/Road on W side/}).waitFor();
    assert.equal(await page.locator(".nroad-variants button").count(),2,"compact 1 BHK has two genuine kitchen orientations");
    const compactFirstId=await page.locator(".nroad-diagram").getAttribute("data-plan-id");
    await page.locator(".nroad-variants button").last().click();
    assert.equal(await page.locator(".nroad-variants button").last().getAttribute("aria-pressed"),"true");
    await page.waitForFunction(previous=>{
      const a=document.querySelector(".nroad-diagram"),b=document.querySelector(".nbd-building");
      return !!a&&!!b&&a.getAttribute("data-plan-id")!==previous
        &&a.getAttribute("data-plan-id")===b.getAttribute("data-plan-id");
    },compactFirstId);
    assert.equal(await page.getByRole("button",{name:"First floor"}).count(),0);
    await page.getByRole("button",{name:"Selected floor cutaway"}).waitFor();
    // Home construction comparison and arbitrary plot-size journey.
    await page.goto(base+"/",{waitUntil:"load"});
    assert.equal(await page.locator(".nbh-quick-quote").count(),1,"materials-first homepage needs itemised quote draft");
     assert.equal(await page.locator(".nbh-photo-hero img").count(),1,"licensed real-house hero replaces old animation");
     assert.equal(await page.locator(".home-stage-comparison img").count(),2,"paired construction-stage renders");
    assert.equal(await page.getByRole("button",{name:/Replay illustration/}).count(),0,"do not fabricate manual state before dragging");
    assert.equal(await page.locator(".home-stage-comparison").count(),1,"construction stages replace static colour mood");
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
    const reveal=page.getByRole("slider",{name:/construction-stage/});
    await reveal.focus();await reveal.press("End");assert.equal(await reveal.inputValue(),"100");
    await reveal.press("Home");assert.equal(await reveal.inputValue(),"0");
    const preset=page.locator("#nbh-studio-preset");
    assert.equal(await preset.count(),1,"home uses a single accessible plot-size picker");
    assert.equal(await preset.inputValue(),"18x50","default selection matches the displayed plot and generated plan");
    assert.equal(await page.locator(".nbh-studio-photo img").count(),1,"only one independent inspiration photo is shown in the planner");
    await preset.selectOption("custom");
    const dimensions=page.locator(".nbh-studio-custom-fields input[type=number]");
    assert.equal(await dimensions.count(),2,"custom plotting accepts both frontage and depth");
    await dimensions.nth(0).fill("9");
    assert.equal(await page.locator(".nbh-studio-generate[href]").count(),0,"invalid dimensions must never open a fallback 18×50 plan");
    for(const [w,d] of [["18","50"],["20","45"]]){
      await dimensions.nth(0).fill(w);
      await dimensions.nth(1).fill(d);
      const link=page.locator(".nbh-studio-generate[href]");
      const href=await link.getAttribute("href");
      assert.ok(href?.includes("width="+w+"&depth="+d), "selected custom plot must reach the geometry generator");
      assert.ok(href?.includes("floors=2&road=N"),"floor and road facing defaults are explicit");
      await link.click();
      await page.waitForURL("**/design-studio/portfolio?**");
      assert.ok(new URL(page.url()).searchParams.get("width")===w&&new URL(page.url()).searchParams.get("depth")===d,
        "portfolio must inherit selected dimensions");
      await page.goto(base+"/",{waitUntil:"load"});
      await page.locator("#nbh-studio-preset").selectOption("custom");
    }
    await page.locator("#nbh-studio-preset").selectOption("30x40");
    const roadOptions=page.locator(".nbh-studio-options");
    await roadOptions.locator("summary").click();
    await roadOptions.locator("#nbh-studio-floors").selectOption("3");
    await roadOptions.locator("#nbh-studio-road").selectOption("W");
    assert.match((await page.locator(".nbh-studio-generate[href]").getAttribute("href"))??"",/width=30&depth=40&floors=3&road=W/,
      "preset, floors and road direction must use one consistent plan link");

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
  const missingCity=await req.request.get(base+"/api/studio/city-rules");
  if(missingCity.status()!==400)failures.push("City rules must reject requests lacking a supported city, received "+missingCity.status());
  const cityRules=await req.request.get(base+"/api/studio/city-rules?city=Kanpur");
  if(![200,503].includes(cityRules.status()))failures.push("City rules for Kanpur returned "+cityRules.status());
  await req.close();
 }finally{await browser.close()}
 fs.writeFileSync("test-results/mobile/performance-baseline.json",JSON.stringify({scope:"390px local browser observations; no field INP claim or cross-run comparison",samples:performanceReports},null,2));
 fs.writeFileSync("test-results/mobile/accessibility-baseline.json",JSON.stringify({
  scope:"Automated axe-core WCAG 2.x A/AA sample at 390px; NOT a full manual WCAG certificate.",
  sampled:accessibilityReports,criticalOrSerious:accessibilityReports.flatMap(r=>("violations" in r?r.violations:[])).filter(v=>["critical","serious"].includes(v.impact??"")).length
 },null,2));
 if(failures.length){console.error("Mobile regression failed:\n"+failures.join("\n"));process.exitCode=1}
 else console.log("Mobile browser smoke: five viewports, private RFQ API denial and privacy-first PWA, material-to-quote navigation, editable colour preview, custom 18×50/20×45 plot massing, construction reveal, no browser errors, protected API denials.");
}
main().catch(error=>{console.error(error);process.exitCode=1});

