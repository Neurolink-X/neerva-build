import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
const db=new URL(process.env.DB_URL??"postgresql://invalid.invalid");
assert.equal(db.protocol,"postgresql:");assert.equal(db.hostname,"127.0.0.1");assert.equal(db.port,"54322");assert.equal(db.pathname,"/postgres");
assert.equal(process.env.NEERVA_E2E_DISPOSABLE,"yes");assert.equal(process.env.NEERVA_E2E_LOCAL,"yes");
const actual=execFileSync("psql",[db.toString(),"-X","-v","ON_ERROR_STOP=1","-At","-c","select (to_regprocedure('public.neerva_confirm_reserved_order(uuid,uuid,jsonb)') is not null and to_regclass('neerva_internal.stock_holds') is not null and exists(select 1 from pg_trigger where tgname='neerva_stock_transition' and tgrelid='public.orders'::regclass and tgenabled='O'))::text"],{encoding:"utf8"}).trim();
assert.equal(actual,"true","Atomic stock migration must be installed by the normal migration chain");
console.log("Permanent stock reservation migration verified; lifecycle concurrency tests follow.");
