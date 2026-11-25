// Exercise logical backup/restore on disposable fixtures only. Not a production backup.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const url=new URL(process.env.DB_URL??"postgresql://invalid.invalid");
assert.equal(url.hostname,"127.0.0.1");assert.equal(url.port,"54322");
assert.equal(url.protocol,"postgresql:");assert.equal(process.env.NEERVA_E2E_DISPOSABLE,"yes");
const name="neerva_recovery_"+randomUUID().replaceAll("-","");
const dir=mkdtempSync(join(tmpdir(),"neerva-recovery-")),dump=join(dir,"catalog.dump");
const query=sql=>execFileSync("psql",[url.toString(),"-X","-v","ON_ERROR_STOP=1","-At","-c",sql],{encoding:"utf8"}).trim();
try{
 query("create schema "+name+"; create table "+name+".catalog_snapshot as select slug,status::text,attributes from public.products where status='draft' and attributes->>'origin'='neerva-static-reference'");
 const fingerprint=()=>query("select count(*)||':'||md5(coalesce(string_agg(slug||':'||status||':'||attributes::text,',' order by slug),'')) from "+name+".catalog_snapshot");
 const before=fingerprint();assert.ok(Number(before.split(":")[0])>0,"Expected imported fixture catalog");
 execFileSync("pg_dump",[url.toString(),"--format=custom","--no-owner","--no-acl","--schema="+name,"--file="+dump],{stdio:"pipe"});
 query("drop schema "+name+" cascade");
 execFileSync("pg_restore",["--dbname="+url.toString(),"--no-owner","--no-acl","--exit-on-error",dump],{stdio:"pipe"});
 assert.equal(fingerprint(),before);
 console.log(JSON.stringify({scope:"disposable catalog snapshot only",restoredRows:Number(before.split(":")[0]),checksumMatched:true}));
}finally{try{query("drop schema if exists "+name+" cascade")}finally{rmSync(dir,{recursive:true,force:true})}}
