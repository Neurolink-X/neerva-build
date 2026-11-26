import test from "node:test";import assert from "node:assert/strict";import {normaliseStudioCity,studioPublicClient} from "./city-regulations.ts";
test("only known research cities can request published regulations",()=>{assert.equal(normaliseStudioCity(" RANCHI "),"ranchi");assert.equal(normaliseStudioCity("kanpur"),"kanpur");assert.equal(normaliseStudioCity("Some other city"),null)});
test("never create a public studio database client with a shared, missing or secret key",()=>{
 assert.equal(studioPublicClient("https://example.supabase.co",undefined),null);
 assert.equal(studioPublicClient("https://example.supabase.co","sb_secret_12345"),null);
 assert.equal(studioPublicClient("http://example.supabase.co","sb_publishable_12345"),null);
});

test("explicit missing credentials fail closed even with production-like environment",()=>{
 const names=["NEERVA_STUDIO_SUPABASE_URL","NEERVA_STUDIO_PUBLISHABLE_KEY"] as const;
 const previous=names.map(name=>process.env[name]);
 try{
  process.env[names[0]]="https://djgghisbkucprqiezrcn.supabase.co";
  process.env[names[1]]="sb_publishable_test_fixture";
  assert.equal(studioPublicClient("https://example.supabase.co",undefined)===null,true,"explicit missing key must never inherit an environment key");
  assert.equal(studioPublicClient(undefined,"sb_publishable_test_fixture")===null,true,"explicit missing URL must never inherit an environment URL");
  assert.equal(studioPublicClient(undefined,undefined)===null,true,"explicit missing credentials must never select a configured database");
  assert.equal(studioPublicClient()!==null,true,"runtime no-argument call still uses the dedicated configuration");
 }finally{
  names.forEach((name,index)=>{const value=previous[index];if(value===undefined)delete process.env[name];else process.env[name]=value;});
 }
});

test("dedicated studio database rejects another Supabase tenant or noncanonical credential-bearing URL",()=>{
 const key="sb_publishable_test_fixture",allowed="https://djgghisbkucprqiezrcn.supabase.co";
 assert.equal(studioPublicClient(allowed,key)!==null,true);
 for(const url of ["https://example.supabase.co","https://mwfcwhxdlnqldciigicl.supabase.co",allowed+"/other",allowed+"?x=1",allowed+"#other","https://user:pass@djgghisbkucprqiezrcn.supabase.co",allowed+":8443"]){
  assert.equal(studioPublicClient(url,key)===null,true,"reject incorrect studio origin");
 }
});
