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
  const fingerprint=()=>query("select count(*)||':'||md5(coalesce(string_agg(slug||':'||status||':'||attributes::text,',' order by slug),'')) from "+name+".catalog_snapshot");
  const before=fingerprint();assert.ok(Number(before.split(":")[0])>0,"Expected imported fixture catalog");
  const dump=run("pg_dump",[...connection,"--format=custom","--no-owner","--no-acl","--schema="+name]);
  assert.ok(dump.length>5&&dump.subarray(0,5).toString("ascii")==="PGDMP","Expected real PostgreSQL custom archive");
  query("drop schema "+name+" cascade");
  run("pg_restore",[...connection,"--no-owner","--no-acl","--exit-on-error","--single-transaction"],dump);
  assert.equal(fingerprint(),before);
  console.log(JSON.stringify({scope:"disposable catalog snapshot only",restoredRows:Number(before.split(":")[0]),checksumMatched:true,postgresMajor:major,matchingContainer:true}));
 }finally{query("drop schema if exists "+name+" cascade")}
}
