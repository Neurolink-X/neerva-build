import test from "node:test";import assert from "node:assert/strict";import {normaliseStudioCity,studioPublicClient} from "./city-regulations.ts";
test("only known research cities can request published regulations",()=>{assert.equal(normaliseStudioCity(" RANCHI "),"ranchi");assert.equal(normaliseStudioCity("kanpur"),"kanpur");assert.equal(normaliseStudioCity("Some other city"),null)});
test("never create a public studio database client with a shared, missing or secret key",()=>{
 assert.equal(studioPublicClient("https://example.supabase.co",undefined),null);
 assert.equal(studioPublicClient("https://example.supabase.co","sb_secret_12345"),null);
 assert.equal(studioPublicClient("http://example.supabase.co","sb_publishable_12345"),null);
});
