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
async function add(id,name,redirect=false){
 return call("POST","/v10/projects/"+id+"/domains",{
  name,...(redirect?{redirect:"neerva.in",redirectStatusCode:308}:{})
 });
}
async function remove(id,name){
 return call("DELETE","/v9/projects/"+id+"/domains/"+encodeURIComponent(name));
}
async function main(){
 const existing=await Promise.all(hostnames.map(name=>domainState(legacy,name)));
 const destination=await Promise.all(hostnames.map(name=>domainState(project,name)));
 for(let i=0;i<hostnames.length;i++)console.log(hostnames[i]+": legacy="+Boolean(existing[i])+" target="+Boolean(destination[i]));
 if(destination.every(Boolean)){console.log("Both domains already on target. Verify HTTPS and aliases; no changes needed.");return;}
 if(!existing.some(Boolean))throw Error("Cannot verify old domain assignments. Stop rather than altering a different project.");
 if(!execute){console.log("DRY RUN ONLY. --execute requires acknowledged downtime risk and ready rollback.");return;}
 for(let i=0;i<hostnames.length;i++){
  if(destination[i])continue;
  const name=hostnames[i],old=existing[i];
  if(!old)throw Error("Unexpected missing previous assignment for "+name+". Halt.");
  console.log("Moving "+name+" to Neerva Build…");
  await remove(legacy,name);
  try{await add(project,name,i===1);}
  catch(error){
   console.error("Target association failed for "+name+"; attempting to restore legacy assignment.");
   try{await add(legacy,name,i===0);}catch(rollbackError){console.error("ROLLBACK FAILED. Restore domain in Vercel dashboard:",String(rollbackError));}
   throw error;
  }
 }
 const verified=await Promise.all(hostnames.map(name=>domainState(project,name)));
 if(!verified.every(x=>x?.verified===true))throw Error("Domain assigned but verification pending. Do NOT enable redirects/indexing yet.");
 console.log("Assignments verified. Check HTTPS/TLS response and public routes independently; then enable canonical cutover.");
}
main().catch(error=>{console.error(String(error));process.exitCode=1});
