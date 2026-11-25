import test from "node:test";
import assert from "node:assert/strict";
import {postgresClientMajor,selectRecoveryContainer,assertRecoveryToolVersion,assertSameDatabase} from "../ops/recovery-tools.ts";
const id="a".repeat(64);
const fixture={Id:id,Config:{Image:"public.ecr.aws/supabase/postgres:17.11.0.006"},State:{Running:true},NetworkSettings:{Ports:{"5432/tcp":[{HostIp:"0.0.0.0",HostPort:"54322"}]}}};
test("select exact PostgreSQL server major from numeric version",()=>{
 assert.equal(postgresClientMajor("170011"),17);
 assert.equal(postgresClientMajor("160016"),16);
 for(const value of ["17.11","", "170011;id","999"])assert.throws(()=>postgresClientMajor(value));
});
test("select exactly the disposable Supabase database container by published port",()=>{
 assert.equal(selectRecoveryContainer([fixture],"54322"),id);
 assert.throws(()=>selectRecoveryContainer([],"54322"));
 assert.throws(()=>selectRecoveryContainer([fixture,fixture],"54322"));
 assert.throws(()=>selectRecoveryContainer([fixture],"5432"));
 assert.throws(()=>selectRecoveryContainer([{...fixture,Config:{Image:"untrusted/postgres:17"}}],"54322"));
 assert.throws(()=>selectRecoveryContainer([{...fixture,State:{Running:false}}],"54322"));
});
test("reject wrong PostgreSQL client major and wrong tool",()=>{
 assert.doesNotThrow(()=>assertRecoveryToolVersion("pg_dump",17,"pg_dump (PostgreSQL) 17.11"));
 assert.doesNotThrow(()=>assertRecoveryToolVersion("pg_restore",17,"pg_restore (PostgreSQL) 17.11"));
 assert.throws(()=>assertRecoveryToolVersion("pg_dump",17,"pg_dump (PostgreSQL) 16.16"));
 assert.throws(()=>assertRecoveryToolVersion("pg_restore",17,"pg_dump (PostgreSQL) 17.11"));
});
test("verify container matches the same database server before destructive fixture work",()=>{
 assert.doesNotThrow(()=>assertSameDatabase("1234567890123456789","1234567890123456789"));
 assert.throws(()=>assertSameDatabase("123","456"));
 assert.throws(()=>assertSameDatabase("",""));
});
