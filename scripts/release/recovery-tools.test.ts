import test from "node:test";
import assert from "node:assert/strict";
import {postgresClientMajor,selectRecoveryTools} from "../ops/recovery-tools.mjs";
test("select exact PostgreSQL server major from numeric version",()=>{
 assert.equal(postgresClientMajor("170011"),17);
 assert.equal(postgresClientMajor("160016"),16);
 for(const value of ["17.11","", "170011;id","999"])assert.throws(()=>postgresClientMajor(value));
});
test("use server-matched dump and restore, not PATH defaults",()=>{
 const t=selectRecoveryTools(17,()=>true,p=>p.endsWith("pg_dump")?"pg_dump (PostgreSQL) 17.11":"pg_restore (PostgreSQL) 17.11");
 assert.equal(t.dump,"/usr/lib/postgresql/17/bin/pg_dump");
 assert.equal(t.restore,"/usr/lib/postgresql/17/bin/pg_restore");
});
test("fail closed before recovery when either client is missing or incompatible",()=>{
 assert.throws(()=>selectRecoveryTools(17,p=>!p.endsWith("pg_restore"),()=>"pg_dump (PostgreSQL) 17.11"),/missing restore/);
 assert.throws(()=>selectRecoveryTools(17,()=>true,()=>"pg_dump (PostgreSQL) 16.16"),/major mismatch/);
});
