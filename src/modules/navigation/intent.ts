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
