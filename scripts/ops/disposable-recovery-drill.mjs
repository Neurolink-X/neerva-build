// Exercise real logical backup/restore on disposable fixtures only. Not a production backup.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {postgresClientMajor,selectRecoveryContainer,assertRecoveryToolVersion,assertSameDatabase} from "./recovery-tools.ts";
const url=new URL(process.env.DB_URL??"postgresql://invalid.invalid");
assert.equal(url.hostname,"127.0.0.1");
assert.equal(url.port,"54322");
assert.equal(url.protocol,"postgresql:");
assert.equal(process.env.NEERVA_E2E_DISPOSABLE,"yes");
assert.equal(process.env.NEERVA_E2E_LOCAL,"yes");
assert.equal(url.pathname,"/postgres");
assert.equal(url.username,"postgres");
assert.ok(url.password&&!url.search&&!url.hash,"Expected explicit disposable database credentials");
const name="neerva_recovery_"+randomUUID().replaceAll("-","");
const query=sql=>execFileSync("psql",[url.toString(),"-X","-v","ON_ERROR_STOP=1","-At","-c",sql],{encoding:"utf8"}).trim();
const major=postgresClientMajor(query("show server_version_num"));
const ids=execFileSync("docker",["ps","-q","--no-trunc"],{encoding:"utf8"}).trim().split(/\s+/).filter(Boolean);
assert.ok(ids.length&&ids.every(id=>/^[a-f0-9]{64}$/.test(id)),"No valid local Docker containers");
const containers=JSON.parse(execFileSync("docker",["inspect",...ids],{encoding:"utf8",maxBuffer:16*1024*1024}));
const container=selectRecoveryContainer(containers,url.port);
const env={...process.env,PGPASSWORD:decodeURIComponent(url.password)};
const run=(tool,args,input)=>execFileSync("docker",["exec","-i","-e","PGPASSWORD",container,tool,...args],{env,input,maxBuffer:32*1024*1024,timeout:120000,stdio:["pipe","pipe","pipe"]});
const connection=["-h","127.0.0.1","-p","5432","-U","postgres","-d","postgres"];
const containerQuery=sql=>run("psql",[...connection,"-X","-v","ON_ERROR_STOP=1","-At","-c",sql]).toString("utf8").trim();
const identitySql="select system_identifier::text from pg_control_system()";
assertSameDatabase(query(identitySql),containerQuery(identitySql));
assert.equal(postgresClientMajor(containerQuery("show server_version_num")),major);
for(const tool of ["pg_dump","pg_restore"])assertRecoveryToolVersion(tool,major,run(tool,["--version"]).toString("utf8").trim());
if(process.argv.includes("--preflight")){
 console.log(JSON.stringify({scope:"disposable recovery preflight",postgresMajor:major,matchingContainer:true}));
}else{
 try{
  query("create schema "+name+"; create table "+name+".catalog_snapshot as select slug,status::text,attributes from public.products where status='draft' and attributes->>'origin'='neerva-static-reference'");
  // Capture business-critical fixture state without passwords, payment references, contact details or addresses.
  query("create table "+name+".order_snapshot as select id,status,total_paise from public.direct_orders; create table "+name+".stock_snapshot as select branch_id,variant_id,available_quantity,unit from public.inventory; create table "+name+".coupon_snapshot as select order_id,code,discount_paise,state from neerva_internal.checkout_coupon_uses; create table "+name+".hold_snapshot as select order_id,branch_id,variant_id,quantity,state from neerva_internal.stock_holds");
  const tables=["catalog_snapshot","order_snapshot","stock_snapshot","coupon_snapshot","hold_snapshot"];
  const fingerprint=()=>Object.fromEntries(tables.map(table=>[table,query("select count(*)||':'||md5(coalesce(string_agg(row_to_json(t)::text,',' order by row_to_json(t)::text),'')) from "+name+"."+table+" t")]));
  const before=fingerprint();for(const table of tables)assert.ok(Number(before[table].split(":")[0])>0,"Expected fixture records in "+table);
  const dump=run("pg_dump",[...connection,"--format=custom","--no-owner","--no-acl","--schema="+name]);
  assert.ok(dump.length>5&&dump.subarray(0,5).toString("ascii")==="PGDMP","Expected real PostgreSQL custom archive");
  query("drop schema "+name+" cascade");
  run("pg_restore",[...connection,"--no-owner","--no-acl","--exit-on-error","--single-transaction"],dump);
  assert.deepEqual(fingerprint(),before);
  console.log(JSON.stringify({scope:"disposable projected business snapshots, not full production restore",restoredRows:Object.fromEntries(tables.map(t=>[t,Number(before[t].split(":")[0])])),checksumMatched:true,postgresMajor:major,matchingContainer:true}));
 }finally{query("drop schema if exists "+name+" cascade")}
}
