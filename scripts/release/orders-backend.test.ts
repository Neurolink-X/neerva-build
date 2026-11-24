import test from "node:test";
import assert from "node:assert/strict";
import {springOrders} from "../../src/modules/orders/backend.ts";

test("Spring proxy fails closed when no backend is configured",async()=>{
 const previous=process.env.ORDER_SERVICE_URL;
 try{
  delete process.env.ORDER_SERVICE_URL;
  const result=await springOrders(new Request("https://neerva.example/api/orders"),"");
  assert.equal(result,null);
 }finally{
  if(previous===undefined)delete process.env.ORDER_SERVICE_URL;
  else process.env.ORDER_SERVICE_URL=previous;
 }
});
test("Spring proxy preserves POST, authenticated JWT and body without downgrading to GET",async()=>{
 const original=globalThis.fetch,old=process.env.ORDER_SERVICE_URL;
 let called=null;
 try{
  process.env.ORDER_SERVICE_URL="https://orders.internal.test";
  globalThis.fetch=async(input,init)=>{
   called={url:String(input),method:init?.method,authorization:init?.headers?.Authorization,body:init?.body};
   return new Response(JSON.stringify({requestId:"test-order",status:"received"}),{status:201,headers:{"content-type":"application/json"}});
  };
  const request=new Request("https://neerva.example/api/orders",{method:"POST",headers:{authorization:"Bearer fixture-token"}});
  const response=await springOrders(request,"",{quantity:2});
  assert.equal(response?.status,201);
  assert.deepEqual(called,{
   url:"https://orders.internal.test/v1/orders",method:"POST",
   authorization:"Bearer fixture-token",body:'{"quantity":2}'
  });
  assert.equal(response.headers.get("cache-control"),"private, no-store");
 }finally{
  globalThis.fetch=original;
  if(old===undefined)delete process.env.ORDER_SERVICE_URL;
  else process.env.ORDER_SERVICE_URL=old;
 }
});
test("Spring proxy forwards GET only for a GET request and hides upstream network errors",async()=>{
 const original=globalThis.fetch,old=process.env.ORDER_SERVICE_URL;
 try{
  process.env.ORDER_SERVICE_URL="https://orders.internal.test";
  globalThis.fetch=async(_input,init)=>{
   assert.equal(init?.method,"GET");
   assert.equal(init?.body,undefined);
   return new Response(JSON.stringify({orders:[]}),{status:200,headers:{"content-type":"application/json"}});
  };
  const request=new Request("https://neerva.example/api/admin/orders",{method:"GET"});
  assert.equal((await springOrders(request,"/admin"))?.status,200);
  globalThis.fetch=async()=>{throw new Error("sensitive infrastructure detail");};
  const failure=await springOrders(request,"");
  assert.equal(failure?.status,503);
  assert.doesNotMatch(await failure.text(),/sensitive infrastructure detail/);
 }finally{
  globalThis.fetch=original;
  if(old===undefined)delete process.env.ORDER_SERVICE_URL;
  else process.env.ORDER_SERVICE_URL=old;
 }
});
