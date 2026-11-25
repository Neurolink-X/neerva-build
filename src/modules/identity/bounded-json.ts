/** Reject oversized/chunked request bodies before buffering the entire payload. */
export async function boundedJson(request:Request,maxBytes:number):Promise<unknown>{
 if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))throw Error("content-type");
 const declared=request.headers.get("content-length");if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>maxBytes))throw Error("size");
 const reader=request.body?.getReader();if(!reader)throw Error("body");
 const decoder=new TextDecoder("utf-8",{fatal:true});let length=0,text="";
 try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>maxBytes){await reader.cancel();throw Error("size")}text+=decoder.decode(value,{stream:true})}text+=decoder.decode();return JSON.parse(text)}finally{reader.releaseLock()}
}
