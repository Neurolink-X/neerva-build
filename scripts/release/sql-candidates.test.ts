import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
for(const path of ["scripts/ops/inventory-reservation-candidate.sql","scripts/ops/studio-concurrency-candidate.sql"]){
 test(path+" has complete SQL dollar-quoted bodies and explicit transactional boundary",()=>{
  const sql=readFileSync(path,"utf8");
  assert.doesNotMatch(sql,/(?<!\$)\$(?!\$)/,"Unexpected single dollar delimiter");
  assert.equal((sql.match(/\$\$/g)??[]).length%2,0,"Unbalanced function body");
  assert.match(sql,/\bbegin;/i);assert.match(sql,/commit;\s*$/i);
 });
}
