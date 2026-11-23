/* Minimal mobile browser gate: no external telemetry, no credentials, no fake metrics. */
import {chromium} from "playwright";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const base=process.env.SMOKE_BASE_URL||"http://127.0.0.1:3000";
const views=[{w:360,h:800},{w:390,h:844},{w:430,h:932},{w:768,h:1024},{w:1440,h:900}];
const routes=["/","/design-studio","/design-studio/library","/design-studio/visualizer","/design-studio/workbench","/materials","/basket","/quotes"];
async function main(){
 fs.mkdirSync("test-results/mobile",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
 const failures=[];
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
    if(v.w===360||v.w===430)await page.screenshot({path:path.join("test-results/mobile",v.w+"-"+(route.replaceAll("/","-")||"home")+".png"),fullPage:true,animations:"disabled"});
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
  await req.close();
 }finally{await browser.close()}
 if(failures.length){console.error("Mobile regression failed:\n"+failures.join("\n"));process.exitCode=1}
 else console.log("Mobile browser smoke: five viewports, eight routes, no horizontal overflow, no browser console errors, fail-closed order API.");
}
main().catch(error=>{console.error(error);process.exitCode=1});
