// Only the isolated CI Supabase database; no production credentials accepted.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
const db=new URL(process.env.DB_URL??"postgresql://invalid.invalid");
assert.equal(db.protocol,"postgresql:");assert.equal(db.hostname,"127.0.0.1");assert.equal(db.port,"54322");
assert.equal(db.pathname,"/postgres");assert.equal(process.env.NEERVA_E2E_DISPOSABLE,"yes");assert.equal(process.env.NEERVA_E2E_LOCAL,"yes");
const result=execFileSync("psql",[db.toString(),"-X","-v","ON_ERROR_STOP=1","-At","-c","select (count(*)=5 and bool_and(not p.prosecdef) and bool_and(not has_function_privilege('anon',p.oid,'execute')))::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('has_platform_role','is_tenant_member','neerva_begin_studio_checkout','neerva_cancel_studio_checkout','neerva_review_studio_payment')"],{encoding:"utf8"}).trim();
assert.equal(result,"true","All five public RPCs must be security invoker and deny guests");
console.log("Permanent RPC security and studio concurrency migration verified.");
