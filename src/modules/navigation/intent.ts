/** Allow only ordinary same-origin document transitions; never prefetch private or arbitrary query URLs. */
export function navigationPath(href:string,current:string):string|null{
 try{const from=new URL(current),to=new URL(href,from);if(to.origin!==from.origin||!["http:","https:"].includes(to.protocol)||to.username||to.password)return null;if(to.pathname===from.pathname&&to.search===from.search)return null;return to.pathname+to.search}catch{return null}
}
export function prefetchPath(href:string,current:string):string|null{
 const path=navigationPath(href,current);if(!path||path.includes("?")||path.length>240||path==="/blog/editorial"||path.startsWith("/blog/editorial/"))return null;
 return /^\/(?:materials(?:\/[a-z0-9-]+){0,2}|brands(?:\/[a-z0-9-]+){0,2}|design-studio(?:\/(?:fit|library|visualizer|road-planner))?|blog(?:\/[a-z0-9-]+){0,2}|learn|build-iq(?:\/[a-z0-9-]+){0,2}|family-homes|inspiration|room-lab|calculators)$/.test(path)?path:null
}
export function takePrefetch(recent:Map<string,number>,path:string,now:number,limit=6,ttl=60000){
 for(const [key,time] of recent)if(now-time>=ttl)recent.delete(key);
 if(recent.has(path)||recent.size>=limit)return false;recent.set(path,now);return true;
}

export type NetworkHint={saveData?:boolean;effectiveType?:string;downlink?:number;rtt?:number};
/** Only use bandwidth speculatively when the browser reports a healthy link.
 * Unknown connection quality is deliberately conservative. */
export function allowSpeculativeNetwork(connection:NetworkHint|undefined,online=true,visible=true):boolean{
 return online&&visible&&!!connection&&!connection.saveData&&connection.effectiveType==="4g"&&
  (connection.downlink===undefined||connection.downlink>=1.5)&&
  (connection.rtt===undefined||connection.rtt<=300);
}

/** Studio assets may warm from 1 Mbps, only after useful content loads and
 * when measured latency and device capacity permit. This is independent of
 * route prefetch; unknown/slow links, hidden tabs and data saver stay on demand. */
export function allowStudioWarmup(connection:NetworkHint|undefined,device:{cores?:number;memory?:number},online=true,visible=true):boolean{
 return online&&visible&&!!connection&&!connection.saveData&&
  (connection.effectiveType==="4g"||connection.effectiveType==="3g")&&
  typeof connection.downlink==="number"&&Number.isFinite(connection.downlink)&&connection.downlink>=1&&
  typeof connection.rtt==="number"&&connection.rtt>=0&&connection.rtt<=150&&
  typeof device.cores==="number"&&device.cores>=4&&
  (device.memory===undefined||device.memory>=4);
}

/** A slower eligible link gets a longer quiet period before optional work. */
export function studioWarmupDelay(connection:NetworkHint):number{
 return (connection.downlink??0)<2?1800:900;
}

/** Constrained connection is a hint, not a measured speed guarantee.
 * Unknown browsers keep the standard lightweight preview; explicit choice wins. */
export function preferLitePreview(connection:NetworkHint|undefined,online=true):boolean{
 return !online||!!connection&&(connection.saveData===true||["slow-2g","2g","3g"].includes(connection.effectiveType??"")||
 (typeof connection.downlink==="number"&&Number.isFinite(connection.downlink)&&connection.downlink<1)||
 (typeof connection.rtt==="number"&&Number.isFinite(connection.rtt)&&connection.rtt>350));
}
