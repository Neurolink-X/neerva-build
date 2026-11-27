import test from "node:test";
import assert from "node:assert/strict";
import {boundedFetch} from "./bounded-fetch.ts";
test("bounded transport preserves caller and SDK abort signals and does not retry",async()=>{
 for(const source of ["parent","sdk","request"]){
  const parent=new AbortController(),sdk=new AbortController();let calls=0;
  const fake:typeof fetch=async(_input,init)=>{calls++;assert.equal(init?.method,"POST");const signal=init?.signal;assert.ok(signal);
   return new Promise<Response>((_resolve,reject)=>{if(signal.aborted)reject(signal.reason);else signal.addEventListener("abort",()=>reject(signal.reason),{once:true});});
  };
  const run=boundedFetch(parent.signal,1000,fake);
  const input=source==="request"?new Request("https://example.test",{signal:sdk.signal}):"https://example.test";
  const pending=run(input,{method:"POST",...(source==="sdk"?{signal:sdk.signal}:{})});
  (source==="parent"?parent:sdk).abort();
  await assert.rejects(pending);assert.equal(calls,1);
 }
});
test("transport refuses invalid deadline values",()=>{assert.throws(()=>boundedFetch(new AbortController().signal,0),RangeError);});
