import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const s=readFileSync("supabase/migrations/0004_design_studio_phase_a.sql","utf8");
test("all five design studio tables have enabled RLS and explicitly scoped policies",()=>{
 for(const table of ["studio_city_rules","studio_design_records","studio_design_assets","studio_user_favourites","studio_design_audit"]){
  assert.ok(s.includes("alter table public."+table+" enable row level security"));
  assert.ok(s.includes("on public."+table+" for "));
 }
});
test("unverified local rules and unapproved images are not public",()=>{
 assert.match(s,/status='verified'/);assert.match(s,/status='approved' and license_kind in \('original','licensed'\)/);
 assert.match(s,/status<>'approved' or/);assert.match(s,/status<>'published' or/);
});
test("no public insert to review tables, favourites owner-scoped, append-only audit",()=>{
 assert.ok(!s.includes("grant insert,update on public.studio_user_favourites to anon"));
 assert.match(s,/user_id=\(select auth.uid\(\)\)/);assert.match(s,/No UPDATE\/DELETE grant on the append-only audit table/);
});
