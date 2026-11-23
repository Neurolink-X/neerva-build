import test from "node:test";
import assert from "node:assert/strict";
import {publicIndexingEnabled} from "./indexing.ts";
test("production can index only with explicit verified HTTPS site flag",()=>{
 const vars={VERCEL_ENV:"production",NEXT_PUBLIC_SITE_INDEXABLE:"true",NEXT_PUBLIC_SITE_URL:"https://neerva-build.vercel.app"};
 assert.equal(publicIndexingEnabled(vars),true);
 for(const env of [
  {...vars,VERCEL_ENV:"preview"},{...vars,VERCEL_ENV:"development"},
  {...vars,NEXT_PUBLIC_SITE_INDEXABLE:"false"},
  {...vars,NEXT_PUBLIC_SITE_URL:"http://neerva-build.vercel.app"},
  {...vars,NEXT_PUBLIC_SITE_URL:"https://localhost"},
  {...vars,NEXT_PUBLIC_SITE_URL:"https://neerva-build.vercel.app/other"}
 ])assert.equal(publicIndexingEnabled(env),false);
});
