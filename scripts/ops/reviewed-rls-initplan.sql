-- Candidate: apply to disposable CI database before role-isolation tests.
-- Do not run against production until reviewed and recorded as a migration.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '20s';
do $review$
declare target record; existing record; expression text; revised text; predicate text;
begin
 for target in select * from (values
  ('tenant_memberships','membership_read_same_tenant','SELECT','user_id'),
  ('marketplace_fee_versions','marketplace_fee_publish','INSERT','created_by'),
  ('dealer_delivery_versions','dealer_delivery_submit','INSERT','created_by'),
  ('sku_tax_versions','sku_tax_admin_publish','INSERT','created_by'),
  ('dealer_product_requests','dealer_product_request_create','INSERT','created_by'),
  ('direct_order_operations','direct_operations_write','INSERT','actor'),
  ('dealer_settlement_events','dealer_settlement_event_insert','INSERT','actor')
 ) as t(tbl,pol,operation,owner_column) loop
  select * into strict existing from pg_policies where schemaname='public' and tablename=target.tbl and policyname=target.pol;
  if existing.cmd<>target.operation or existing.roles<>array['authenticated']::name[] or existing.permissive<>'PERMISSIVE' then
   raise exception 'Unexpected policy contract: %', target.pol;
  end if;
  expression := case when target.operation='SELECT' then existing.qual else existing.with_check end;
  predicate := target.owner_column || ' = auth.uid()';
  if expression is null or (length(expression)-length(replace(expression,predicate,'')))<>length(predicate) then
   raise exception 'Unexpected owner predicate: %', target.pol;
  end if;
  revised := replace(expression,predicate,target.owner_column || ' = (select auth.uid())');
  execute format('alter policy %I on public.%I %s (%s)',target.pol,target.tbl,case when target.operation='SELECT' then 'using' else 'with check' end,revised);
 end loop;
end
$review$;
commit;
