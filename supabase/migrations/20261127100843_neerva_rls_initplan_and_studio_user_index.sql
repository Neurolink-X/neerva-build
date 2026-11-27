-- Optimize the seven reviewed policies without changing roles or authorization predicates.
-- The only expression change is caching the statement-constant auth.uid().
set lock_timeout = '3s';
set statement_timeout = '20s';
do $review$
declare
 p record;
 expression text;
 rewritten text;
 inspected integer := 0;
begin
 for p in
  select schemaname,tablename,policyname,cmd,roles,qual,with_check
  from pg_policies
  where schemaname='public' and (tablename,policyname) in (
   ('tenant_memberships','membership_read_same_tenant'),
   ('marketplace_fee_versions','marketplace_fee_publish'),
   ('dealer_delivery_versions','dealer_delivery_submit'),
   ('sku_tax_versions','sku_tax_admin_publish'),
   ('dealer_product_requests','dealer_product_request_create'),
   ('direct_order_operations','direct_operations_write'),
   ('dealer_settlement_events','dealer_settlement_event_insert')
  )
 loop
  inspected := inspected+1;
  if p.roles::text <> '{authenticated}' or
    (p.tablename='tenant_memberships' and p.cmd <> 'SELECT') or
    (p.tablename<>'tenant_memberships' and p.cmd <> 'INSERT') then
   raise exception 'Unexpected RLS policy scope: %',p.policyname;
  end if;
  expression := case when p.cmd='SELECT' then p.qual else p.with_check end;
  if expression is null or
     (length(expression)-length(replace(expression,'auth.uid()','')))/length('auth.uid()') <> 1 then
   raise exception 'Unexpected RLS expression: %',p.policyname;
  end if;
  if expression ~* 'select[[:space:]]+auth[.]uid[(][)]' then continue; end if;
  rewritten := replace(expression,'auth.uid()','(select auth.uid())');
  if p.cmd='SELECT' then
   execute format('alter policy %I on %I.%I using (%s)',p.policyname,p.schemaname,p.tablename,rewritten);
  else
   execute format('alter policy %I on %I.%I with check (%s)',p.policyname,p.schemaname,p.tablename,rewritten);
  end if;
 end loop;
 if inspected<>7 then raise exception 'Expected seven reviewed policies, found %',inspected; end if;
end
$review$;
-- Full (not partial) user lookup supports all order states and FK maintenance.
create index if not exists studio_paid_orders_user_lookup_idx on public.studio_paid_orders(user_id);
reset lock_timeout;
reset statement_timeout;
