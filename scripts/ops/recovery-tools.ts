// Validate the local disposable container before executing backup tools.
export function postgresClientMajor(value: string): number {
 const version=String(value).trim();
 if(!/^\d{6}$/.test(version))throw Error("Unexpected PostgreSQL server_version_num");
 const major=Math.floor(Number(version)/10000);
 if(major<10||major>99)throw Error("Unsupported PostgreSQL major");
 return major;
}
type LocalContainer={Id?:string;Config?:{Image?:string};State?:{Running?:boolean};NetworkSettings?:{Ports?:Record<string,Array<{HostIp?:string;HostPort?:string}>|null>}};
export function selectRecoveryContainer(containers:LocalContainer[],port:string):string{
 if(port!=="54322")throw Error("Expected disposable database port");
 const matches=containers.filter(c=>c.State?.Running===true
  && /^(?:public\.ecr\.aws\/supabase\/postgres|ghcr\.io\/supabase\/postgres|docker\.io\/supabase\/postgres|supabase\/postgres):[0-9][a-zA-Z0-9._-]*$/.test(c.Config?.Image??"")
  && c.NetworkSettings?.Ports?.["5432/tcp"]?.some(p=>p.HostPort===port&&["127.0.0.1","0.0.0.0","::","::1"].includes(p.HostIp??"")));
 if(matches.length!==1||! /^[a-f0-9]{64}$/.test(matches[0].Id??""))throw Error("Expected exactly one running disposable Supabase PostgreSQL container");
 return matches[0].Id!;
}
export function assertRecoveryToolVersion(tool:"pg_dump"|"pg_restore",major:number,value:string):void{
 const match=value.match(/^(pg_dump|pg_restore) \(PostgreSQL\) (\d+)\./);
 if(!match||match[1]!==tool||Number(match[2])!==major)throw Error("PostgreSQL recovery client major mismatch: "+tool);
}
export function assertSameDatabase(host:string,container:string):void{
 if(!/^\d{1,20}$/.test(host)||host!==container)throw Error("Recovery container database identity mismatch");
}
