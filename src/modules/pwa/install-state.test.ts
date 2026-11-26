import test from "node:test";
import assert from "node:assert/strict";
import {installedDisplayMode} from "./install-state.ts";
test("installed app modes and iOS hide installation offers",()=>{
 assert.equal(installedDisplayMode([true,false,false],false,""),true);
 assert.equal(installedDisplayMode([false,true,false],false,""),true);
 assert.equal(installedDisplayMode([false,false,true],false,""),true);
 assert.equal(installedDisplayMode([false,false,false],true,""),true);
 assert.equal(installedDisplayMode([false,false,false],false,"android-app://example"),true);
 assert.equal(installedDisplayMode([false,false,false],false,"https://example.com"),false);
});
