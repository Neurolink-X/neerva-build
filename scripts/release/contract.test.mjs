import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {createHash} from "node:crypto";
import {validateProductionContract} from "./contract.mjs";
const ref="dpl_GBZpLhjcXvCdihSX7Lfd2YqBwnZF";
const url="https://djgghisbkucprqiezrcn.supabase.co";
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),"neerva-release-"));
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 const baselineFiles=Array.from({length:100},(_,i)=>"legacy/file-"+i+".tsx");
 const requiredFiles=Array.from({length:10},(_,i)=>"required/flow-"+i+".tsx");
 const protectedPaths=baselineFiles.slice(0,15);
 const protectedGitBlobs={};
 for(const p of [...baselineFiles,...requiredFiles]){
  const dest=join(root,p);mkdirSync(dirname(dest),{recursive:true});
  const source="export const active = true;\n";writeFileSync(dest,source);
  if(protectedPaths.includes(p)){
   const buffer=Buffer.from(source);
   protectedGitBlobs[p]=createHash("sha1").update("blob "+buffer.length+"\0").update(buffer).digest("hex");
  }
 }
 const file=join(root,"release/production-contract.json");
 mkdirSync(dirname(file),{recursive:true});
 const manifest={version:2,referenceDeployment:ref,baselineFiles,requiredFiles,protectedGitBlobs};
 const save=()=>writeFileSync(file,JSON.stringify(manifest));
 save();return{root,manifest,save};
}
test("contract accepts reviewed Phase 1 source, protected hashes and forward changes elsewhere",t=>{
 const f=fixture(t);
 assert.deepEqual(validateProductionContract({root:f.root}),[]);
 writeFileSync(join(f.root,f.manifest.requiredFiles[0]),"a new visual flow\n");
 assert.deepEqual(validateProductionContract({root:f.root}),[]);
});
test("contract rejects changes to protected order/auth code until its reviewed Git blob hash changes",t=>{
 const f=fixture(t);
 writeFileSync(join(f.root,f.manifest.baselineFiles[0]),"different business logic\n");
 assert.match(validateProductionContract({root:f.root}).join(" "),/Protected business code changed/);
});
test("contract rejects missing legacy source without silently accepting new CI",t=>{
 const f=fixture(t);rmSync(join(f.root,f.manifest.baselineFiles[1]));
 assert.match(validateProductionContract({root:f.root}).join(" "),/Missing critical source/);
});
test("contract rejects invalid manifest path and traversal",t=>{
 const f=fixture(t);f.manifest.requiredFiles[0]="../secrets";f.save();
 assert.match(validateProductionContract({root:f.root}).join(" "),/Invalid\/traversal/);
});
test("production only uses isolated Neerva Supabase and verified publishable key",t=>{
 const f=fixture(t);
 const env={VERCEL_ENV:"production",VERCEL_GIT_COMMIT_REF:"main",NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_ANON_KEY:"sb_publishable_"+"a".repeat(48)};
 assert.deepEqual(validateProductionContract({root:f.root,env}),[]);
 assert.match(validateProductionContract({root:f.root,env:{...env,NEXT_PUBLIC_SUPABASE_URL:"https://mwfcwhxdlnqldciigicl.supabase.co"}}).join(" "),/isolated Neerva/);
 assert.match(validateProductionContract({root:f.root,env:{...env,NEXT_PUBLIC_SUPABASE_ANON_KEY:""}}).join(" "),/publishable Supabase key missing/);
});
