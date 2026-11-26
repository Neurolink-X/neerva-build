import test from "node:test";
import assert from "node:assert/strict";
import {installedDisplayMode} from "./install-state.ts";
test("installed app modes and iOS hide installation offers",()=>{
 for(let i=0;i<3;i++)assert.equal(installedDisplayMode([0,1,2].map(x=>x===i),false),true);
 assert.equal(installedDisplayMode([false,false,false],true),true);
 assert.equal(installedDisplayMode([false,false,false],false),false);
});
