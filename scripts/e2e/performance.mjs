/* Reproducible Chromium lab benchmark. No customer data or writes. */
import {chromium} from "playwright";
import {mkdirSync,writeFileSync} from "node:fs";
const base=new URL(process.env.PERF_BASE_URL||"http://127.0.0.1:3000");
const live=base.origin==="https://neerva-build.vercel.app";
if(!live&&base.origin!=="http://127.0.0.1:3000")throw Error("Benchmark target must be the local production build or Neerva production host.");
const routes=["/","/materials","/materials/cement/ppc-cement-50kg","/design-studio","/design-studio/fit","/studio-pricing"];
const budgets={lcp:2500,cls:0.1,ttfb:800,interaction:200,api:600};
const samples=3,report={target:base.origin,commit:process.env.GITHUB_SHA??null,startedAt:new Date().toISOString(),profile:"390x844, DPR 2, 4x CPU, 1.6 Mbps down, 750 kbps up, 150ms latency; cold browser contexts",budgets,routes:[],api:[],failures:[]};
const percentile=(values,p)=>{const s=values.filter(Number.isFinite).sort((a,b)=>a-b);return s.length?s[Math.ceil(s.length*p)-1]:null};
mkdirSync("test-results/performance",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
try{
 for(const route of routes){
  const runs=[];
  for(let i=0;i<samples;i++){
   const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:"block"});
   try{
    const page=await ctx.newPage(),cdp=await ctx.newCDPSession(page);
    await cdp.send("Network.enable");await cdp.send("Network.setCacheDisabled",{cacheDisabled:true});
    await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750,connectionType:"cellular4g"});
    await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
    await page.addInitScript(()=>{
     const m=window.__qaPerf={lcp:null,cls:0,interaction:null,longTaskMs:0};let start=0,last=0,cluster=0;
     function observe(type,handler,options={}){try{new PerformanceObserver(list=>{for(const e of list.getEntries())handler(e)}).observe({type,buffered:true,...options})}catch{/* unsupported metric remains missing */}}
     observe("largest-contentful-paint",e=>{m.lcp=e.startTime});
     observe("layout-shift",e=>{if(e.hadRecentInput)return;if(e.startTime-last>1000||e.startTime-start>5000){start=e.startTime;cluster=0}cluster+=e.value;last=e.startTime;m.cls=Math.max(m.cls,cluster)});
     observe("event",e=>{if(e.interactionId)m.interaction=Math.max(m.interaction??0,e.duration)},{durationThreshold:16});
     observe("longtask",e=>{m.longTaskMs+=e.duration});
    });
    const response=await page.goto(base.origin+route,{waitUntil:"load",timeout:60000});if(response?.status()!==200)throw Error("HTTP "+response?.status());
    await page.waitForTimeout(1600);
    const before=await page.evaluate(()=>{const n=performance.getEntriesByType("navigation")[0];return {...window.__qaPerf,ttfb:n?.responseStart??null,domContentLoaded:n?.domContentLoadedEventEnd??null,transferBytes:performance.getEntriesByType("resource").reduce((s,e)=>s+e.transferSize,0)+(n?.transferSize??0)}});
    const summary=page.locator("details > summary").first();
    if(await summary.count()&&await summary.isVisible()){await summary.click({timeout:4000});await page.waitForTimeout(300);}
    const interaction=await page.evaluate(()=>window.__qaPerf.interaction);
    runs.push({...before,interaction});
   }catch(e){report.failures.push(route+" sample "+(i+1)+": "+String(e.message).slice(0,140));}finally{await ctx.close()}
  }
  const p75=Object.fromEntries(["lcp","cls","ttfb","interaction","domContentLoaded","transferBytes","longTaskMs"].map(k=>[k,percentile(runs.map(r=>r[k]),.75)]));
  for(const key of ["lcp","cls","ttfb"]){if(p75[key]===null||p75[key]>budgets[key])report.failures.push(route+" "+key+": "+p75[key]+" (budget "+budgets[key]+")")}
  if(p75.interaction!==null&&p75.interaction>budgets.interaction)report.failures.push(route+" sampled interaction: "+p75.interaction);
  report.routes.push({route,runs,p75});console.log(route+" "+JSON.stringify(p75));
 }
 const ctx=await browser.newContext();
 try{for(const endpoint of ["/api/catalog","/api/catalog/prices","/api/catalog/offers","/api/studio/config"]){
  const times=[];for(let i=0;i<5;i++){const t=performance.now();const r=await ctx.request.get(base.origin+endpoint,{timeout:20000});await r.body();if(r.status()!==200)report.failures.push(endpoint+" HTTP "+r.status());times.push(Math.round(performance.now()-t))}
  const p95=percentile(times,.95);report.api.push({endpoint,times,p95});if(p95>budgets.api)report.failures.push(endpoint+" p95 "+p95+"ms");
 }}finally{await ctx.close()}
}catch(e){report.failures.push(String(e.message).slice(0,200))}
finally{await browser.close();report.finishedAt=new Date().toISOString();report.status=report.failures.length?"failed":"passed";writeFileSync("test-results/performance/report.json",JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,failures:report.failures}));if(report.failures.length)process.exitCode=1}
