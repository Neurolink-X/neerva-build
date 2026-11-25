#!/usr/bin/env node
/**
 * Manual emergency-safe project-domain reassignment. Dry run unless --execute.
 * Prerequisites: NEERVA custom-domain release approved, current production READY,
 * both websites backed up, DNS and account-level domain verification checked.
 * Never use "vercel domains remove": that removes account ownership.
 */
const project="prj_R2sfMbaSydlIuL5irrpGibdwvUqJ";
const legacy="prj_UtSrOj7Z1HjQx2xgUtSQvyEGY2dE";
const teamId="team_jjcuOvfhQsFSt1A9xTbVlETm";
const hostnames=["neerva.in","www.neerva.in"];
const execute=process.argv.includes("--execute");
if(process.argv.includes("--help")){
 console.log("Dry run: node scripts/ops/migrate-primary-domain.mjs\nExecute with VERCEL_TOKEN set and --execute only after approval, backups and verified production build.");
 process.exit(0);
}
const token=process.env.VERCEL_TOKEN;
if(!token){console.log("No VERCEL_TOKEN. Read-only migration steps:");console.log("Detach both "+hostnames.join(", ")+" from old "+legacy+", attach to new "+project+". Confirm HTTPS, then enable cutover vars.");process.exit(execute?1:0);}
async function call(method,endpoint,body){
 const url="https://api.vercel.com"+endpoint+(endpoint.includes("?")?"&":"?")+"teamId="+encodeURIComponent(teamId);
 const res=await fetch(url,{method,headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
  ...(body?{body:JSON.stringify(body)}:{})});
 const content=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(method+" "+endpoint+" returned "+res.status+": "+String(content.error?.code??"API_ERROR"));
 return content;
}
async function domainState(id,name){
 try{return await call("GET","/v9/projects/"+id+"/domains/"+encodeURIComponent(name));}
 catch(e){if(String(e).includes("returned 404"))return null;throw e;}
}
async function add(id,name,previous=null){
 return call("POST","/v10/projects/"+id+"/domains",{
  name,...(previous?.redirect?{redirect:previous.redirect,redirectStatusCode:previous.redirectStatusCode??308}:{}),...(previous?.gitBranch?{gitBranch:previous.gitBranch}:{})
 });
}
async function remove(id,name){
 return call("DELETE","/v9/projects/"+id+"/domains/"+encodeURIComponent(name));
}
async function main(){
 if(execute){
  const sha=process.env.NEERVA_APPROVED_PRODUCTION_SHA??"";
  if(!/^[0-9a-f]{40}$/.test(sha)||process.env.NEERVA_DOMAIN_BACKUP_CONFIRMED!=="yes")throw Error("Exact approved production SHA and backup confirmation required");
  const result=await call("GET","/v6/deployments?projectId="+project+"&target=production&limit=1");
  const latest=result.deployments?.[0];
  if(!latest||latest.state!=="READY"&&latest.readyState!=="READY"||latest.meta?.githubCommitSha!==sha||latest.meta?.githubCommitRef!=="main")throw Error("Latest production deployment does not match approved main SHA");
  const probe=await fetch("https://neerva-build.vercel.app/api/catalog",{redirect:"error",signal:AbortSignal.timeout(10000)});
  if(!probe.ok)throw Error("Neerva production catalog probe failed");
  const data=await probe.json();if(!Array.isArray(data.categories)||!Array.isArray(data.products))throw Error("Neerva production catalog response invalid");
 }
 const existing=await Promise.all(hostnames.map(name=>domainState(legacy,name)));
 const destination=await Promise.all(hostnames.map(name=>domainState(project,name)));
 for(let i=0;i<hostnames.length;i++)console.log(hostnames[i]+": legacy="+Boolean(existing[i])+" target="+Boolean(destination[i]));
 if(destination.every(Boolean)){console.log("Both domains already on target. Verify HTTPS and aliases; no changes needed.");return;}
 if(!existing.some(Boolean))throw Error("Cannot verify old domain assignments. Stop rather than altering a different project.");
 if(!execute){console.log("DRY RUN ONLY. --execute requires acknowledged downtime risk and ready rollback.");return;}
 const moved=[];
 try{
  for(let i=0;i<hostnames.length;i++){
   if(destination[i])continue;
   const name=hostnames[i],old=existing[i];
   if(!old||!old.verified)throw Error("Unverified previous assignment for "+name);
   await remove(legacy,name);
   moved.push({name,old});
   await add(project,name,i===1?{redirect:"neerva.in",redirectStatusCode:308}:null);
  }
  const verified=await Promise.all(hostnames.map(name=>domainState(project,name)));
  if(!verified.every(x=>x?.verified===true))throw Error("Target verification failed");
  for(const name of hostnames){
   const response=await fetch("https://"+name+"/api/catalog",{redirect:"follow",signal:AbortSignal.timeout(15000)});
   if(!response.ok||!["neerva.in","www.neerva.in"].includes(new URL(response.url).hostname))throw Error("HTTPS verification failed for "+name);
   const payload=await response.json();
   if(!Array.isArray(payload.categories)||!Array.isArray(payload.products))throw Error("Wrong application on "+name);
  }
 }catch(error){
  for(const {name,old} of moved.reverse()){
   try{
    if(await domainState(project,name))await remove(project,name);
    if(!await domainState(legacy,name))await add(legacy,name,old);
   }catch(rollbackError){console.error("ROLLBACK FAILED for "+name+": "+String(rollbackError));}
  }
  throw error;
 }
 console.log("Assignments verified. Check HTTPS/TLS response and public routes independently; then enable canonical cutover.");
}
main().catch(error=>{console.error(String(error));process.exitCode=1});
