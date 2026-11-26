/* Minimal mobile browser gate: no external telemetry, no credentials, no fake metrics. */
import {chromium} from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {assessPerformance} from "./performance-budget.mjs";
const base=process.env.SMOKE_BASE_URL||"http://127.0.0.1:3000";
const views=[{w:360,h:800},{w:390,h:844},{w:430,h:932},{w:768,h:1024},{w:1440,h:900}];
const routes=["/","/room-lab","/build-iq","/inspiration","/design-studio","/design-studio/library","/design-studio/fit","/design-studio/visualizer","/design-studio/workbench","/design-studio/road-planner","/design-studio/portfolio","/materials","/basket","/quotes","/install","/account","/account/dealer","/terms","/returns","/studio-pricing","/learn","/admin","/admin/orders","/admin/rfqs","/admin/fulfilment","/admin/catalog","/admin/pricing","/admin/marketing","/admin/dealers","/admin/studio-settings","/admin/studio-payments","/admin/studio","/admin/users","/admin/system-health","/admin/audit","/admin/account-recovery","/dealer/dashboard","/dealer/inventory","/dealer/quotes","/dealer/orders"];
async function main(){
 fs.mkdirSync("test-results/mobile",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
 const failures=[],accessibilityReports=[],performanceReports=[],interactionReports=[];
 try{
  // Focused extra screen sizes without repeating the full expensive suite.
  for(const v of [{w:320,h:640},{w:1024,h:768},{w:1920,h:1080}]){
   const ctx=await browser.newContext({viewport:{width:v.w,height:v.h}});
   try{const page=await ctx.newPage();
    for(const route of ["/","/materials","/materials/bricks-blocks","/materials/bricks-blocks/red-clay-brick","/brands","/design-studio/visualizer","/build-iq","/checkout?cart=1"]){
     const response=await page.goto(base+route,{waitUntil:"load",timeout:60000});assert.equal(response?.status(),200,route);
     const result=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),broken:[...document.images].filter(i=>i.complete&&i.getBoundingClientRect().width>0&&!i.naturalWidth).map(i=>i.getAttribute("src"))}));
     if(result.scroll>result.width+2)failures.push(v.w+"px "+route+": responsive overflow "+(result.scroll-result.width)+"px");
     if(result.broken.length)failures.push(v.w+"px "+route+": broken visible images "+JSON.stringify(result.broken));
    }
   }finally{await ctx.close()}
  }
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
    // Record actual visible interactive targets without clicking destructive or authenticated actions.
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
    if(v.w===390&&["/","/materials","/design-studio","/design-studio/fit","/design-studio/visualizer","/room-lab","/build-iq","/inspiration"].includes(route)){
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     const timing=await page.evaluate(()=>{const n=performance.getEntriesByType("navigation")[0],m=window.__neervaPerf;return {ttfbMs:n?Math.round(n.responseStart):null,loadMs:n?Math.round(n.loadEventEnd):null,lcpMs:m?.lcp==null?null:Math.round(m.lcp),cls:m?.cls??null};});
     const budget=assessPerformance(timing);
     performanceReports.push({route,width:v.w,...timing,budget,scope:"initial load observation, not field Web Vitals"});
     for(const issue of budget.failures)failures.push("Severe local performance regression "+route+": "+issue);
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
    const nav=await page.evaluate(()=>({feedback:window.__neervaClickFeedback,elapsed:performance.now()-(window.__neervaClickFeedback?.at??performance.now())}));
    assert.ok(nav.feedback?.active,"internal Link shows feedback synchronously without a full reload");
    assert.equal(await page.locator(".neerva-navigation-feedback").getAttribute("data-active"),null,"feedback clears after navigation");
    // A deliberately missing document emits a browser console 404. Check its HTTP
    // contract through the request context so real browser errors remain fatal.
    const invalid=await page.request.get(base+"/materials/no-such-category");
    try{assert.equal(invalid.status(),404,"missing catalog pages must keep real HTTP 404");}finally{await invalid.dispose();}
    performanceReports.push({route:"/ → /materials",width:v.w,clickToReadyMs:Math.round(nav.elapsed),scope:"local browser route transition, not field latency"});
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
    await lab.getByRole("slider",{name:/Construction stage/}).focus();
    await lab.getByRole("slider",{name:/Construction stage/}).press("End");
    assert.ok(await lab.getByRole("heading",{name:"Finishes and handover"}).isVisible());
    await lab.getByRole("slider",{name:/Openings:/}).focus();
    await lab.getByRole("slider",{name:/Openings:/}).press("End");
    assert.match(await lab.locator(".build-results").innerText(),/20 sq ft/);
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
    await page.getByRole("heading",{name:"Get Neerva on your device"}).waitFor({state:"visible"});
    assert.equal(await page.locator(".neerva-install-banner").count(),0,"no duplicate global banner on install instructions");
    await page.evaluate(()=>{
      const event=new Event("beforeinstallprompt",{cancelable:true});
      Object.assign(event,{prompt:async()=>undefined,userChoice:Promise.resolve({outcome:"accepted"})});
      window.dispatchEvent(event);
    });
    await page.getByRole("button",{name:"Install Neerva",exact:true}).waitFor({state:"visible"});
    await page.getByRole("button",{name:"Install Neerva",exact:true}).click();
    await page.getByText("Installation accepted. Check your home screen.").waitFor();
    // Acceptance alone is not proof of installation. Exercise the actual browser-event contract.
    await page.evaluate(()=>window.dispatchEvent(new Event("appinstalled")));
    await page.getByRole("heading",{name:"Neerva is ready to use"}).waitFor({state:"visible"});
    assert.equal(await page.locator('a[href="/install"]').count(),0,"installed state hides shared header, menu and footer install links");
    await page.getByRole("link",{name:"Open Neerva",exact:true}).click();
    await page.waitForURL(base+"/");
    await page.locator(".nbh-header").waitFor({state:"visible"});
    assert.equal(await page.locator('a[href="/install"]').count(),0,"client navigation keeps install controls hidden");
    assert.equal(await page.locator(".neerva-install-banner").count(),0,"installed app never displays install banner");
    await page.reload({waitUntil:"load"});
    assert.equal(await page.locator('a[href="/install"]').count(),0,"installed state survives reload");
    // Reset only the simulated preference before testing an uninstalled browser.
    await page.evaluate(()=>localStorage.removeItem("neerva-installed-v1"));
    await page.reload({waitUntil:"load"});
    await page.locator(".neerva-install-banner").waitFor({state:"visible"});
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
        if(route==="/install")await installedPage.getByRole("heading",{name:"Neerva is ready to use"}).waitFor();
      }
    }finally{await standaloneCtx.close();}
    const account=await page.goto(base+"/account",{waitUntil:"load"});
    assert.equal(account?.status(),200,"authenticated account route");
    assert.equal(await page.getByRole("heading",{name:/Access your projects and requests/}).count(),1,"account page must not show prelaunch placeholder");
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
    const unauth=await page.request.post(base+"/api/rfqs",{data:{idempotencyKey:"f1d3068d-3f5f-4e5c-a14e-2546fb9902ed"}});
    const expectedUnauth=process.env.NEERVA_RFQ_INTAKE_ENABLED==="true"&&process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?401:503;
    assert.equal(unauth.status(),expectedUnauth,"RFQ must fail closed: 401 only when intake and auth are enabled, otherwise 503");
    await page.goto(base+"/",{waitUntil:"load"});
    await page.locator(".neerva-install-banner").waitFor({state:"visible",timeout:15000});
    assert.equal(await page.locator(".neerva-install-banner").count(),1,"discoverable installation help is available on first visit without scroll");
     assert.equal(await page.locator(".neerva-install-banner").locator("a,button").filter({hasText:/^(How to install|Install app)$/}).count(),1,"browser-specific install help entry is usable");
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
    const academyCount=await page.locator(".academy-grid article").count();
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
    await page.getByText(`1 of ${academyCount} lessons explored`,{exact:true}).waitFor();
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
    await page.goto(base+"/inspiration",{waitUntil:"load"});
    await page.getByRole("button",{name:"Interiors",exact:true}).click();
    assert.equal(await page.locator(".inspiration-card").count(),3,"interior discovery filter");
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
    const visual=await page.goto(base+"/design-studio/visualizer",{waitUntil:"load"});
    assert.equal(visual?.status(),200,"colour editor route");
    assert.equal(await page.locator(".paint-live-workspace .paint-adjacent-controls").count(),1,"colour controls are adjacent to live preview");
    const paintLayout=await page.locator(".paint-live-workspace").evaluate(el=>{const canvas=el.querySelector(".paint-live-preview"),palette=el.querySelector(".paint-adjacent-controls");return !!canvas&&!!palette&&canvas.nextElementSibling?.contains(palette)});
    assert.ok(paintLayout,"photo and palette occupy a single workspace");
    const roomPreview=page.locator(".nbd-photo canvas");
    await roomPreview.waitFor({state:"visible"});
    const samplePixel=()=>roomPreview.evaluate(c=>Array.from(c.getContext("2d").getImageData(Math.floor(c.width*.5),Math.floor(c.height*.32),1,1).data).slice(0,3));
    await page.getByRole("button",{name:"Select #293f36",exact:true}).click();
    await page.waitForFunction(()=>{const c=document.querySelector(".nbd-photo canvas"),p=c.getContext("2d").getImageData(Math.floor(c.width*.5),Math.floor(c.height*.32),1,1).data;return p[1]>p[0]&&p[1]>p[2]&&p[1]<90});
    const dark=await samplePixel();
    await page.getByRole("button",{name:"Select #edf2db",exact:true}).click();
    await page.waitForFunction(d=>{const c=document.querySelector(".nbd-photo canvas");return c.getContext("2d").getImageData(Math.floor(c.width*.5),Math.floor(c.height*.32),1,1).data[1]>d[1]+70},dark);
    await page.getByRole("button",{name:"Paint + design",exact:true}).click();
    const actionSizes=await page.locator(".paint-wall-actions button,.paint-preview-actions button").evaluateAll(bs=>bs.filter(b=>b.getClientRects().length>0).map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})));
    assert.ok(actionSizes.length>=3&&actionSizes.every(b=>b.w>=100&&b.h>=44&&b.h<=88),"wall actions stay compact and readable");
    assert.equal(await page.locator(".paint-wall-actions .paint-more").getAttribute("open"),null,"advanced wall tools are initially collapsed");
    assert.equal(await page.locator(".paint-live-preview .paint-preview-actions button").count(),2,"compare and save remain next to the canvas");
    assert.equal(await page.getByRole("combobox",{name:"Wall design",exact:true}).count(),0,"no duplicate pattern selector");
    await page.getByRole("button",{name:"Sample house exterior"}).click();
    const preview=page.locator(".nbd-photo canvas");
    await preview.waitFor({state:"visible"});
    assert.equal(await page.getByRole("button",{name:"Plain paint",exact:true}).getAttribute("aria-pressed"),"true");
    assert.equal(await page.getByRole("group",{name:"Wall design samples",exact:true}).count(),0,"plain mode hides patterns");
    // Test actual painted canvas pixels, not merely sample labels or changed image hashes.
    const visualCases=[
      {id:"family",label:/Modern family home/,w:1536,h:512,paint:[[420,60],[600,335],[250,420],[1200,100],[750,122],[750,316]],protect:[[1050,160],[500,200],[1450,80],[750,160],[750,350]]},
      {id:"contemporary",label:/Contemporary home/,w:880,h:738,paint:[[130,470],[575,414],[270,490]],protect:[[575,365],[365,190],[750,620]]},
      {id:"villa",label:/Premium villa/,w:880,h:584,paint:[[790,320],[640,300],[390,320]],protect:[[520,210],[500,460],[100,100]]},
      {id:"compact-family",label:/100 gaj family home/,w:351,h:161,paint:[[115,12],[280,36],[150,78],[280,95]],protect:[[140,40],[210,39],[245,115],[15,15]]}
    ];
    assert.equal(await page.locator(".paint-sample-gallery button").count(),visualCases.length,"every house must have a pixel regression case");
    const evidence=[];
    for(const sample of visualCases){
      await page.getByRole("button",{name:sample.label}).click();
      await page.waitForFunction(id=>{const c=document.querySelector(".nbd-photo canvas");return c?.dataset.sample===id&&c.getBoundingClientRect().height>0&&!!document.querySelector(".paint-preview-actions button")},sample.id);
      await page.getByRole("button",{name:"Full exterior",exact:true}).click();
      await page.getByRole("button",{name:"View original",exact:true}).click();
      const points=[...sample.paint,...sample.protect].map(([x,y])=>[x/sample.w,y/sample.h]);
      const pixels=()=>preview.evaluate((canvas,coords)=>coords.map(([x,y])=>Array.from(canvas.getContext("2d").getImageData(Math.floor(x*canvas.width),Math.floor(y*canvas.height),1,1).data).slice(0,3)),points);
      const unpainted=await pixels();
      await preview.screenshot({path:path.join("test-results/mobile","390-facade-"+sample.id+"-original.png")});
      await page.getByRole("button",{name:"Show new paint",exact:true}).click();
      await page.getByRole("button",{name:"Select #edf2db",exact:true}).click();
      const pale=await pixels();
      const started=Date.now();
      await page.getByRole("button",{name:"Select #293f36",exact:true}).click();
      await page.waitForFunction(({coords,count})=>{const c=document.querySelector(".nbd-photo canvas");return coords.slice(0,count).every(([x,y])=>{const p=c.getContext("2d").getImageData(Math.floor(x*c.width),Math.floor(y*c.height),1,1).data;return p[1]>p[0]&&p[1]>p[2]&&p[1]<100})},{coords:points,count:sample.paint.length},{timeout:1500});
      const elapsed=Date.now()-started,dark=await pixels();
      for(let i=0;i<sample.paint.length;i++)assert.ok(pale[i][1]>dark[i][1]+45,sample.id+" wall "+i+" changes shade");
      assert.deepEqual(dark.slice(sample.paint.length),unpainted.slice(sample.paint.length),sample.id+" windows/cladding/pool/sky remain unchanged");
      assert.deepEqual(pale.slice(sample.paint.length),unpainted.slice(sample.paint.length),sample.id+" protected areas remain unchanged with pale shade");
      await preview.screenshot({path:path.join("test-results/mobile","390-facade-"+sample.id+"-painted.png")});
      evidence.push({sample:sample.id,wallPoints:sample.paint.length,protectedPoints:sample.protect.length,automationElapsedMs:elapsed});
    }
    fs.writeFileSync("test-results/mobile/facade-pixel-evidence.json",JSON.stringify({scope:"390px Chromium canvas sample points; elapsed includes browser automation and is not field INP",samples:evidence},null,2));
    await page.getByRole("button",{name:"Paint + design",exact:true}).click();
    await page.getByRole("button",{name:"Diamond lattice",exact:true}).click();
    await page.getByRole("button",{name:"Sample room",exact:true}).click();
 const canvas=page.locator(".nbd-photo canvas");
 await canvas.waitFor({state:"visible"});await canvas.scrollIntoViewIfNeeded();
 async function mark(x){let b=await canvas.boundingBox();for(const [u,v] of [[x,.12],[x+.12,.12],[x+.12,.26],[x,.26]])await canvas.click({position:{x:u*b.width,y:v*b.height}});}
 await page.getByText("Wall selection tools",{exact:true}).click();
 await page.getByRole("button",{name:/Reset wall selection/}).click();
 await mark(.06);
 await page.getByRole("button",{name:"Paint + design",exact:true}).click();
 await page.getByRole("button",{name:"Pinstripes",exact:true}).click();
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
      const qualityTargets=await qualityOptions.locator("button").evaluateAll(buttons=>buttons.map(button=>button.getBoundingClientRect().height));
      assert.equal(qualityTargets.length,2,"both rendering quality choices remain available");
      assert.ok(qualityTargets.every(height=>height>=44),"expanded quality controls have full touch targets");
      await qualityOptions.locator("summary").click();
    }
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
    if(!(await roadOptions.evaluate(el=>el.open)))await roadOptions.locator("summary").click();
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
  const securityHeaders=(await req.request.get(base+"/")).headers();
  for(const [key,value] of Object.entries({"x-content-type-options":"nosniff","x-frame-options":"DENY","x-permitted-cross-domain-policies":"none"})){if(securityHeaders[key]!==value)failures.push("Security header missing or invalid: "+key);}
  if(!securityHeaders["content-security-policy"]?.includes("frame-ancestors 'none'"))failures.push("Clickjacking CSP protection missing");
  const missingCity=await req.request.get(base+"/api/studio/city-rules");
  if(missingCity.status()!==400)failures.push("City rules must reject requests lacking a supported city, received "+missingCity.status());
  const cityRules=await req.request.get(base+"/api/studio/city-rules?city=Kanpur");
  if(![200,503].includes(cityRules.status()))failures.push("City rules for Kanpur returned "+cityRules.status());
  await req.close();
 }finally{await browser.close()}
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

