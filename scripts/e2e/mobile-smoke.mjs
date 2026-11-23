/* Minimal mobile browser gate: no external telemetry, no credentials, no fake metrics. */
import {chromium} from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const base=process.env.SMOKE_BASE_URL||"http://127.0.0.1:3000";
const views=[{w:360,h:800},{w:390,h:844},{w:430,h:932},{w:768,h:1024},{w:1440,h:900}];
const routes=["/","/design-studio","/design-studio/library","/design-studio/fit","/design-studio/visualizer","/design-studio/workbench","/materials","/basket","/quotes","/account","/terms","/returns"];
async function main(){
 fs.mkdirSync("test-results/mobile",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
 const failures=[],accessibilityReports=[];
 try{
  for(const v of views){
   const ctx=await browser.newContext({viewport:{width:v.w,height:v.h},deviceScaleFactor:1,isMobile:v.w<=430,hasTouch:v.w<=430});
   const page=await ctx.newPage(),errors=[];
   page.on("pageerror",error=>errors.push("uncaught: "+error.message));
   page.on("console",message=>{if(message.type()==="error")errors.push("console: "+message.text().slice(0,180))});
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
    assert.equal(await page.locator(".neerva-install-banner").count(),0,"do not show install prompt on first paint");
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
    // Home construction comparison and arbitrary plot-size journey.
    await page.goto(base+"/",{waitUntil:"networkidle"});
    const reveal=page.getByRole("slider",{name:"Compare illustrative construction-stage and completed homes"});
    assert.equal(await reveal.count(),1,"construction comparison needs a keyboard-accessible range slider");
    await reveal.fill("74");
    assert.equal(await reveal.inputValue(),"74","range input should move construction reveal");
    assert.equal(await page.getByText("FINISHED HOME",{exact:true}).count(),1,"finished stage must be visibly labeled");
    const dimensions=page.locator(".nbh-filter-row input[type=number]");
    assert.equal(await dimensions.count(),2,"home must support arbitrary plot width and depth");
    for(const [w,d] of [["18","50"],["20","45"]]){
      await dimensions.nth(0).fill(w);
      await dimensions.nth(1).fill(d);
      const link=page.getByRole("link",{name:/Open detailed plot fit/});
      assert.match((await link.getAttribute("href"))??"",new RegExp("width="+w+"&depth="+d),"plot dimensions need to persist into fit flow");
      await link.click();
      await page.waitForURL("**/design-studio/fit?**");
      await page.getByText("Plot proportion in 3D").waitFor({timeout:15000});
      await page.getByText(w+" × "+d+" ft",{exact:true}).first().waitFor({timeout:10000});
      assert.equal(await page.getByRole("img",{name:new RegExp("Isometric massing concept for a "+w+" by "+d)}).count(),1,"dynamic 3D plot massing should show");
      await page.goto(base+"/",{waitUntil:"networkidle"});
    }

   }
   await page.goto(base+"/",{waitUntil:"networkidle"});
   const mainLink=page.getByRole("link",{name:/Design my home/i}).first();
   if(await mainLink.count()){
     const box=await mainLink.boundingBox();
     if(box&&box.height<44)failures.push(v.w+"px: primary CTA smaller than 44px");
   }else failures.push(v.w+"px: missing main design CTA");
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
