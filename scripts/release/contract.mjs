import {existsSync,lstatSync,readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve,sep} from "node:path";

const allowedUrl = "https://djgghisbkucprqiezrcn.supabase.co";
const expectedReference = "dpl_GBZpLhjcXvCdihSX7Lfd2YqBwnZF";
const isPathSafe=p=>typeof p==="string"&&p.length>0&&p.length<=320&&!p.startsWith("/")&&!p.includes("\\")&&!p.includes("\0")&&p.split("/").every(x=>x&&x!=="."&&x!=="..");
function filePath(root,p){const out=resolve(root,p);return out.startsWith(resolve(root)+sep)?out:null}
function repoBlobHash(buffer){return createHash("sha1").update("blob "+buffer.length+"\0").update(buffer).digest("hex")}

/** Deterministic release contract: preserves original routes/assets and pins risky workflows.
 * Intentional protected-code changes require a reviewed hash update in the same PR.
 * This replaces the unattainable original-byte parity + manual SHA env var gate.
 */
export function validateProductionContract({root=process.cwd(),env=process.env,manifestPath="release/production-contract.json"}={}){
 const errors=[];
 if(!isPathSafe(manifestPath))return ["Invalid contract file path"];
 const manifestFile=filePath(root,manifestPath);
 if(!manifestFile||!existsSync(manifestFile))return ["Missing release/production-contract.json"];
 let contract;
 try{contract=JSON.parse(readFileSync(manifestFile,"utf8"))}catch{return ["Invalid release contract JSON"]}
 if(contract.version!==2||contract.referenceDeployment!==expectedReference)errors.push("Unrecognized contract version or Phase 1 source reference");
 const files=contract.baselineFiles,required=contract.requiredFiles,protectedBlobs=contract.protectedGitBlobs;
 if(!Array.isArray(files)||files.length<100)errors.push("Original production file inventory incomplete");
 if(!Array.isArray(required)||required.length<10)errors.push("Required feature file inventory incomplete");
 if(!protectedBlobs||typeof protectedBlobs!=="object"||Array.isArray(protectedBlobs)||Object.keys(protectedBlobs).length<15)errors.push("Protected business-code hash inventory incomplete");
 if(errors.length)return errors;
 const all=[...files,...required,...Object.keys(protectedBlobs)];
 if(all.some(p=>!isPathSafe(p)))return ["Invalid/traversal path in release contract"];
 for(const [group,values] of [["baseline",files],["required",required]]){
  if(new Set(values).size!==values.length)errors.push("Duplicate "+group+" paths in release contract");
 }
 if(new Set(Object.keys(protectedBlobs)).size!==Object.keys(protectedBlobs).length)errors.push("Duplicate protected paths");
 for(const p of new Set(all)){
  const file=filePath(root,p);
  if(!file||!existsSync(file)||!lstatSync(file).isFile()){errors.push("Missing critical source: "+p);continue}
  const pinned=protectedBlobs[p];
  if(pinned!==undefined){
   if(typeof pinned!=="string"||!/^[0-9a-f]{40}$/.test(pinned)){errors.push("Invalid pinned Git blob hash: "+p);continue}
   if(repoBlobHash(readFileSync(file))!==pinned)errors.push("Protected business code changed without updated reviewed hash: "+p);
  }
 }
 if(env.VERCEL_ENV==="production"){
  if(env.VERCEL_GIT_COMMIT_REF&&env.VERCEL_GIT_COMMIT_REF!=="main")errors.push("Production must build from main");
  if(env.NEXT_PUBLIC_SUPABASE_URL!==allowedUrl)errors.push("Production Supabase URL must point to the isolated Neerva project");
  if(typeof env.NEXT_PUBLIC_SUPABASE_ANON_KEY!=="string"||env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length<40)errors.push("Production publishable Supabase key missing");
 }
 return errors;
}
