/** Bounded recovery; never retry ambiguous writes or trust external API destinations. */
export function trustedApiPath(path:string,origin:string):string|null{
 if(!/^\/api\/[a-z0-9/_-]+(?:\?[^#]*)?$/i.test(path)||path.includes("\\")||path.length>4096)return null;
 try{const url=new URL(path,origin);if(url.origin!==origin||!url.pathname.startsWith("/api/")||url.username||url.password)return null;return url.pathname+url.search}catch{return null}
}
export function safeRecoveryPage(path:string,search:string):boolean{
 return !search&&(/^\/$|^\/(?:materials(?:\/[a-z0-9-]+){0,2}|brands(?:\/[a-z0-9-]+){0,2}|learn|build-iq(?:\/[a-z0-9-]+){0,2}|blog(?:\/[a-z0-9-]+)?|family-homes)$/.test(path))&&path!=="/blog/editorial";
}
export function recoveryKey(path:string){return "neerva:page-recovery:v1:"+path}
export function recoveryAllowed(previous:string|null,now:number){if(previous===null)return true;const value=Number(previous);return Number.isFinite(value)&&now-value>=600000}
export function transientReadStatus(status:number){return status===502||status===503||status===504}
export function transientNetworkError(error:unknown){return error instanceof TypeError||(error instanceof DOMException&&error.name==="TimeoutError")}
export async function readWithRecovery<T extends {status:number}>(method:string,request:()=>Promise<T>,canRetry:()=>Promise<boolean>,pause:()=>Promise<void>,discard?:(r:T)=>void):Promise<T>{
 let response:T;
 try{response=await request()}catch(error){
  if(method!=="GET"||!transientNetworkError(error))throw error;
  await pause();if(!await canRetry())throw error;
  return request();
 }
 if(method!=="GET"||!transientReadStatus(response.status))return response;
 await pause();if(!await canRetry())return response;
 discard?.(response);return request();
}
