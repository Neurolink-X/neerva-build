import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
const db=new URL(process.env.DB_URL??"postgresql://invalid.invalid");
assert.equal(db.protocol,"postgresql:");assert.equal(db.hostname,"127.0.0.1");assert.equal(db.port,"54322");assert.equal(db.pathname,"/postgres");
assert.equal(process.env.NEERVA_E2E_DISPOSABLE,"yes");assert.equal(process.env.NEERVA_E2E_LOCAL,"yes");
execFileSync("psql",[db.toString(),"-X","-v","ON_ERROR_STOP=1","-f","scripts/ops/order-acceptance-candidate.sql"],{stdio:"inherit"});
