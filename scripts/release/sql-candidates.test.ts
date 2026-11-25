import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
for(const path of ["scripts/ops/inventory-reservation-candidate.sql","scripts/ops/studio-concurrency-candidate.sql","scripts/ops/order-acceptance-candidate.sql"]){
 test(path+" has complete SQL dollar-quoted bodies and explicit transactional boundary",()=>{
  const sql=readFileSync(path,"utf8");
  assert.doesNotMatch(sql,/(?<!\$)\$(?!\$)/,"Unexpected single dollar delimiter");
  assert.equal((sql.match(/\$\$/g)??[]).length%2,0,"Unbalanced function body");
  assert.match(sql,/\bbegin;/i);assert.match(sql,/commit;\s*$/i);
 });
}

test("order acceptance explicitly joins verified dealer PINs without ambiguous PL/pgSQL identifier",()=>{
 const sql=readFileSync("scripts/ops/order-acceptance-candidate.sql","utf8");
 assert.doesNotMatch(sql,/\bapplication_id\s+uuid\b/);
 assert.match(sql,/pin\.application_id=app\.id/);
 assert.match(sql,/pin\.pincode=request_row\.pincode/);
 assert.match(sql,/app\.gstin_verification='verified'/);
});
