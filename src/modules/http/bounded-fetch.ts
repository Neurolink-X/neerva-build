/** Keep caller cancellation and SDK cancellation intact; never retry a mutation here. */
export function boundedFetch(parent:AbortSignal,timeoutMs:number,transport:typeof fetch=globalThis.fetch):typeof fetch{
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1)throw new RangeError("Invalid HTTP timeout");
 return (input,init)=>{
  const inherited=init?.signal??(input instanceof Request?input.signal:undefined);
  const signal=AbortSignal.any([parent,AbortSignal.timeout(timeoutMs),...(inherited?[inherited]:[])]);
  return transport(input,{...init,signal});
 };
}
