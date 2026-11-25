-- Candidate: disposable rehearsal only. No production migration or implicit legacy SKU mapping.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
-- Inventory remains sellable (unreserved) quantity. An explicit seller mapping is required.
create table neerva_internal.stock_holds(
 order_id uuid not null references public.orders(id),
 branch_id uuid not null,
 variant_id uuid not null,
 quantity numeric(14,3) not null check(quantity>0),
 unit text not null,
 state text not null default 'held' check(state in ('held','released','consumed')),
 expires_at timestamptz not null,
 created_at timestamptz not null default statement_timestamp(),
 primary key(order_id,branch_id,variant_id),
 foreign key(branch_id,variant_id) references public.inventory(branch_id,variant_id)
);
alter table neerva_internal.stock_holds enable row level security;
revoke all on neerva_internal.stock_holds from public,anon,authenticated;
create index stock_holds_active_idx on neerva_internal.stock_holds(branch_id,variant_id) where state='held';
create index stock_holds_expiry_idx on neerva_internal.stock_holds(expires_at,order_id) where state='held';
-- Block stale absolute-stock overwrites while stock is held. Internal transactional
-- release/decrement uses owner privilege, not a caller-controlled session setting.
create function neerva_internal.guard_held_inventory() returns trigger language plpgsql
security invoker set search_path='' as $$
begin
 if current_user in ('authenticated','anon') and exists(
  select 1 from public.neerva_has_stock_hold(old.branch_id,old.variant_id) h where h
 ) then raise exception 'STOCK_HELD_REFRESH_AFTER_RELEASE' using errcode='23514'; end if;
 if tg_op='DELETE' then return old;end if;return new;
end$$;
create function neerva_internal.has_stock_hold(b uuid,v uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
 select 1 from public.merchant_branches x where x.id=b and public.is_tenant_member(x.tenant_id)
 ) and exists(select 1 from neerva_internal.stock_holds h where h.branch_id=b and h.variant_id=v and h.state='held')
$$;
revoke all on function neerva_internal.has_stock_hold(uuid,uuid) from public,anon,authenticated;
grant execute on function neerva_internal.has_stock_hold(uuid,uuid) to authenticated;
create function public.neerva_has_stock_hold(b uuid,v uuid) returns boolean
language sql stable security invoker set search_path='' as $$select neerva_internal.has_stock_hold(b,v)$$;
revoke all on function public.neerva_has_stock_hold(uuid,uuid) from public,anon,authenticated;
grant execute on function public.neerva_has_stock_hold(uuid,uuid) to authenticated;
revoke all on function neerva_internal.guard_held_inventory() from public,anon,authenticated;
create trigger neerva_guard_held_inventory before update or delete on public.inventory for each row execute function neerva_internal.guard_held_inventory();
-- Lock order first, then inventory rows in deterministic order. The seller selects
-- one exact published variant per quoted line; quantities and units come from order.
create function neerva_internal.reserve_order_stock(p_order uuid,p_branch uuid,p_mapping jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype;line record; item record; n integer; actor uuid:=auth.uid();
begin
 if actor is null or not coalesce(public.neerva_account_access_allowed(),false) then raise exception 'AUTH_REQUIRED' using errcode='42501';end if;
 select * into o from public.orders where id=p_order for update;
 if not found or not public.is_tenant_member(o.tenant_id,array['owner','manager','dispatch']::text[]) then raise exception 'ORDER_ACCESS_DENIED' using errcode='42501';end if;
 if o.status<>'pending_confirmation' then raise exception 'ORDER_NOT_PENDING' using errcode='23514';end if;
 if not exists(select 1 from public.merchant_branches b join public.tenants t on t.id=b.tenant_id join public.dealer_applications a on a.tenant_id=t.id join public.dealer_service_pincodes pin on pin.application_id=a.id where b.id=p_branch and b.tenant_id=o.tenant_id and b.approved and t.status='active' and a.status='approved' and a.gstin_verification='verified' and pin.pincode=o.pincode) then raise exception 'BRANCH_COVERAGE_INVALID' using errcode='23514';end if;
 if exists(select 1 from neerva_internal.stock_holds h where h.order_id=p_order) then raise exception 'ORDER_HOLD_ALREADY_RECORDED' using errcode='23505';end if;
 n:=jsonb_array_length(o.line_items);
 if p_mapping is null or jsonb_typeof(p_mapping)<>'array' or jsonb_array_length(p_mapping)<>n then raise exception 'EXACT_LINE_MAPPING_REQUIRED' using errcode='23514';end if;
 -- A mapping array in the original order line sequence; quantities never supplied by client.
 for line in select l.value as item,m.value as variant from jsonb_array_elements(o.line_items) with ordinality l(value,pos) join jsonb_array_elements_text(p_mapping) with ordinality m(value,pos) using(pos) loop
  if not exists(select 1 from public.product_variants v join public.products p on p.id=v.product_id join public.categories c on c.id=p.category_id where v.id=line.variant::uuid and v.status='published' and p.status='published' and c.status='published' and v.unit=line.item->>'unit')
   or (line.item->>'quantity')::numeric<=0 or (line.item->>'quantity')::numeric<>round((line.item->>'quantity')::numeric,3)
   then raise exception 'SKU_UNIT_OR_QUANTITY_INVALID' using errcode='23514';end if;
 end loop;
 for item in select m.value::uuid variant_id,sum((l.value->>'quantity')::numeric) quantity,min(l.value->>'unit') unit from jsonb_array_elements(o.line_items) with ordinality l(value,pos) join jsonb_array_elements_text(p_mapping) with ordinality m(value,pos) using(pos) group by m.value::uuid order by m.value::uuid loop
  update public.inventory i set available_quantity=i.available_quantity-item.quantity where i.branch_id=p_branch and i.variant_id=item.variant_id and i.unit=item.unit and i.available_quantity>=item.quantity;
  if not found then raise exception 'INSUFFICIENT_AVAILABLE_STOCK' using errcode='23514';end if;
  insert into neerva_internal.stock_holds(order_id,branch_id,variant_id,quantity,unit,expires_at) values(p_order,p_branch,item.variant_id,item.quantity,item.unit,statement_timestamp()+interval '30 minutes');
 end loop;
 insert into public.audit_logs(actor_id,tenant_id,action,object_type,object_id,safe_metadata) values(actor,o.tenant_id,'stock.held','order',o.id::text,jsonb_build_object('branchId',p_branch,'lineCount',n));
 return true;
end$$;
revoke all on function neerva_internal.reserve_order_stock(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function neerva_internal.reserve_order_stock(uuid,uuid,jsonb) to authenticated;
create function public.neerva_reserve_order_stock(p_order uuid,p_branch uuid,p_mapping jsonb) returns boolean language sql security invoker set search_path='' as $$select neerva_internal.reserve_order_stock(p_order,p_branch,p_mapping)$$;
revoke all on function public.neerva_reserve_order_stock(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.neerva_reserve_order_stock(uuid,uuid,jsonb) to authenticated;
-- Internal helper: caller already holds order row lock. Never re-add dispatched stock.
create function neerva_internal.finish_stock_hold(p_order uuid,p_state text) returns void language plpgsql security definer set search_path='' as $$
declare h record;
begin
 if p_state not in ('released','consumed') then raise exception 'BAD_HOLD_STATE';end if;
 for h in select * from neerva_internal.stock_holds where order_id=p_order and state='held' order by branch_id,variant_id for update loop
  if p_state='released' then
   update public.inventory set available_quantity=available_quantity+h.quantity where branch_id=h.branch_id and variant_id=h.variant_id and unit=h.unit;
   if not found then raise exception 'STOCK_RECONCILIATION_REQUIRED';end if;
  end if;
  update neerva_internal.stock_holds set state=p_state where order_id=p_order and branch_id=h.branch_id and variant_id=h.variant_id;
 end loop;
end$$;
revoke all on function neerva_internal.finish_stock_hold(uuid,text) from public,anon,authenticated;
create function neerva_internal.order_stock_transition() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status=old.status then return new;end if;
 if new.status='confirmed' and exists(select 1 from neerva_internal.stock_holds where order_id=old.id) and not exists(select 1 from neerva_internal.stock_holds where order_id=old.id and state='held' and expires_at>statement_timestamp()) then raise exception 'STOCK_HOLD_EXPIRED' using errcode='23514';end if;
 if new.status in ('cancelled','declined') and old.status<>'out_for_delivery' then perform neerva_internal.finish_stock_hold(old.id,'released');end if;
 if new.status='out_for_delivery' then perform neerva_internal.finish_stock_hold(old.id,'consumed');end if;
 return new;
end$$;
revoke all on function neerva_internal.order_stock_transition() from public,anon,authenticated;
create trigger neerva_stock_transition after update of status on public.orders for each row execute function neerva_internal.order_stock_transition();
-- Bounded expiry: only pending holds, not confirmed/preparing/dispatched orders.
create function neerva_internal.expire_stock_holds(p_limit integer default 50) returns integer language plpgsql security definer set search_path='' as $$
declare o record; n integer:=0;
begin
 if auth.uid() is null or not coalesce(public.neerva_account_access_allowed(),false) or not public.has_platform_role(array['admin','super_admin']::public.platform_role[]) then raise exception 'ADMIN_REQUIRED' using errcode='42501';end if;
 for o in select id from public.orders where status='pending_confirmation' and exists(select 1 from neerva_internal.stock_holds h where h.order_id=orders.id and h.state='held' and h.expires_at<=statement_timestamp()) order by id limit greatest(1,least(coalesce(p_limit,50),100)) for update skip locked loop
  perform neerva_internal.finish_stock_hold(o.id,'released');n:=n+1;
 end loop;return n;
end$$;
revoke all on function neerva_internal.expire_stock_holds(integer) from public,anon,authenticated;
grant execute on function neerva_internal.expire_stock_holds(integer) to authenticated;
create function public.neerva_expire_stock_holds(p_limit integer default 50) returns integer language sql security invoker set search_path='' as $$select neerva_internal.expire_stock_holds(p_limit)$$;
revoke all on function public.neerva_expire_stock_holds(integer) from public,anon,authenticated;
grant execute on function public.neerva_expire_stock_holds(integer) to authenticated;
commit;
