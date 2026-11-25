// Select matching PostgreSQL client tools before making any fixture changes.
export function postgresClientMajor(value){
 const version=String(value).trim();
 if(!/^\d{6}$/.test(version))throw Error("Unexpected PostgreSQL server_version_num");
 const major=Math.floor(Number(version)/10000);
 if(major<10||major>99)throw Error("Unsupported PostgreSQL major");
 return major;
}
export function selectRecoveryTools(major,exists,versionOf){
 if(!Number.isInteger(major)||major<10||major>99)throw Error("Invalid PostgreSQL major");
 const prefix="/usr/lib/postgresql/"+major+"/bin/";
 const tools={dump:prefix+"pg_dump",restore:prefix+"pg_restore"};
 for(const [name,command] of Object.entries(tools)){
  if(!exists(command))throw Error("Install postgresql-client-"+major+" before the recovery drill: missing "+name);
  const version=String(versionOf(command));
  const match=version.match(/^(?:pg_dump|pg_restore) \(PostgreSQL\) (\d+)\./);
  if(!match||Number(match[1])!==major)throw Error("PostgreSQL recovery client major mismatch: "+name);
 }
 return tools;
}
