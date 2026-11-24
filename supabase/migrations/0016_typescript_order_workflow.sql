-- NEERVA BUILD: first-party TypeScript/Supabase order persistence.
-- Additive migration. No Java service, payment capture, test fixtures or seeded orders.
-- Orders exist only after a signed-in customer explicitly accepts a verified,
-- unexpired, latest-revision dealer offer and supplies an actual delivery address.

create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 code text not null default ('NB-' || upper(substring(replace(gen_random_uuid()::text,'-','') from 1 for 10))) unique,
 quote_request_id uuid not null unique references public.quote_requests(id) on delete restrict,
 quote_offer_id uuid not null references public.quote_offers(id) on delete restrict,
 idempotency_key uuid not null,
 customer_id uuid not null references auth.users(id) on delete restrict,
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 business_name text not null,
 contact_name text not null,
 phone text not null,
 delivery_address text not null check(char_length(btrim(delivery_address)) between 12 and 300),
 city text not null,
 pincode text not null check(pincode ~ '^[1-9][0-9]{5}$'),
 line_items jsonb not null check(jsonb_typeof(line_items)='array' and jsonb_array_length(line_items) between 1 and 30),
 subtotal_paise bigint not null check(subtotal_paise > 0),
 tax_paise bigint not null check(tax_paise >= 0),
 freight_paise bigint not null check(freight_paise >= 0),
 unloading_paise bigint not null check(unloading_paise >= 0),
 total_paise bigint not null check(total_paise > 0),
 currency text not null default 'INR' check(currency='INR'),
 status text not null default 'pending_confirmation' check(status in
  ('pending_confirmation','confirmed','preparing','out_for_delivery','delivered','cancelled','declined')),
 invoice_number text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(customer_id,idempotency_key),
 check(total_paise=subtotal_paise+tax_paise+freight_paise+unloading_paise),
 check(invoice_number is null) -- No generated tax invoice or synthetic payment confirmation.
);
create index if not exists orders_customer_time_idx on public.orders(customer_id,created_at desc);
create index if not exists orders_tenant_status_idx on public.orders(tenant_id,status,created_at desc);
create index if not exists orders_created_idx on public.orders(created_at desc);

alter table public.orders enable row level security;
revoke all on public.orders from public,anon,authenticated;
grant select on public.orders to authenticated;
grant insert(quote_offer_id,idempotency_key,delivery_address) on public.orders to authenticated;
grant update(status) on public.orders to authenticated;

-- Membership alone is insufficient: the dealer tenant and its GST-reviewed
-- application must also be active. Prevent cross-tenant order/address exposure.
create policy neerva_orders_read on public.orders for select to authenticated using (
 customer_id=(select auth.uid())
 or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 or (
  (select public.is_tenant_member(tenant_id))
  and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active')
  and exists(select 1 from public.dealer_applications da where da.tenant_id=orders.tenant_id
   and da.status='approved' and da.gstin_verification='verified')
 )
);
create policy neerva_orders_insert_customer on public.orders for insert to authenticated
 with check(customer_id=(select auth.uid()));
create policy neerva_orders_update_allowed on public.orders for update to authenticated
 using (
  customer_id=(select auth.uid())
  or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
  or ((select public.is_tenant_member(tenant_id,array['owner','manager','dispatch']::text[]))
   and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'))
 )
 with check (
  customer_id=(select auth.uid())
  or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
  or ((select public.is_tenant_member(tenant_id,array['owner','manager','dispatch']::text[]))
   and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'))
 );

-- Invoker may provide ONLY quote_offer_id, delivery_address, idempotency_key.
-- Before-insert trigger overwrites all commercial and identity fields using
-- an authoritative row-locked offer/quote; callers cannot alter totals, status,
-- customer, dealer, address PIN or invoice details.
create or replace function public.neerva_order_prepare_insert()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,auth,pg_temp as $$
declare
 actor uuid := auth.uid();
 chosen public.quote_offers%rowtype;
 request_row public.quote_requests%rowtype;
 seller public.tenants%rowtype;
 application_id uuid;
 source_lines jsonb;
begin
 if actor is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if new.idempotency_key is null or new.quote_offer_id is null or
    new.delivery_address is null or char_length(btrim(new.delivery_address)) not between 12 and 300 then
  raise exception using errcode='23514',message='INVALID_ORDER_DETAILS';
 end if;
 select * into chosen from public.quote_offers where id=new.quote_offer_id;
 if not found then raise exception using errcode='23514',message='OFFER_NOT_FOUND'; end if;
 select * into request_row from public.quote_requests where id=chosen.quote_request_id for update;
 if not found or request_row.requester_id is distinct from actor then
  raise exception using errcode='42501',message='NOT_CUSTOMER_OFFER';
 end if;
 if request_row.status not in ('open','quoted') or
    exists(select 1 from public.orders existing where existing.quote_request_id=request_row.id) then
  raise exception using errcode='23505',message='RFQ_ALREADY_ACCEPTED';
 end if;
 if chosen.valid_until <= statement_timestamp() or chosen.currency <> 'INR' or
    chosen.total_paise <= 0 or chosen.total_paise > 20000000000 or
    chosen.total_paise <> chosen.subtotal_paise+chosen.tax_paise+chosen.freight_paise+chosen.unloading_paise then
  raise exception using errcode='23514',message='OFFER_EXPIRED_OR_INVALID';
 end if;
 if exists(select 1 from public.quote_offers newer
   where newer.quote_request_id=chosen.quote_request_id and newer.tenant_id=chosen.tenant_id
    and newer.revision>chosen.revision) then
  raise exception using errcode='23514',message='NEWER_OFFER_REVISION_AVAILABLE';
 end if;
 if not exists(select 1 from public.quote_invites invite where
   invite.quote_request_id=chosen.quote_request_id and invite.tenant_id=chosen.tenant_id
   and invite.status in ('invited','viewed','responded')) then
  raise exception using errcode='23514',message='OFFER_NOT_INVITED';
 end if;
 select * into seller from public.tenants where id=chosen.tenant_id;
 if not found or seller.status<>'active' then
  raise exception using errcode='23514',message='DEALER_NOT_ACTIVE';
 end if;
 select app.id into application_id from public.dealer_applications app
 where app.tenant_id=chosen.tenant_id and app.status='approved' and app.gstin_verification='verified';
 if application_id is null or not exists(
  select 1 from public.dealer_service_pincodes p
  where p.application_id=application_id and p.pincode=request_row.pincode
 ) then
  raise exception using errcode='23514',message='DEALER_DELIVERY_AREA_UNVERIFIED';
 end if;
 if jsonb_typeof(chosen.line_items)<>'array' or jsonb_array_length(chosen.line_items) not between 1 and 30 then
  raise exception using errcode='23514',message='INVALID_OFFER_LINES';
 end if;
 select jsonb_agg(jsonb_build_object(
  'productName',line->>'description','quantity',(line->>'quantity')::numeric,
  'unit',line->>'unit',
  'lineTotalPaise',round((line->>'quantity')::numeric*(line->>'unitPricePaise')::numeric)::bigint
 )) into source_lines
 from jsonb_array_elements(chosen.line_items) as line;
 if source_lines is null or
   (select coalesce(sum((item->>'lineTotalPaise')::bigint),0)
    from jsonb_array_elements(source_lines) item) <> chosen.subtotal_paise then
  raise exception using errcode='23514',message='OFFER_TOTAL_MISMATCH';
 end if;
 new.quote_request_id:=request_row.id;
 new.customer_id:=actor;
 new.tenant_id:=chosen.tenant_id;
 new.business_name:=seller.business_name;
 new.contact_name:=request_row.contact_name;
 new.phone:=request_row.phone;
 new.city:=request_row.city;
 new.pincode:=request_row.pincode;
 new.delivery_address:=btrim(new.delivery_address);
 new.line_items:=source_lines;
 new.subtotal_paise:=chosen.subtotal_paise;
 new.tax_paise:=chosen.tax_paise;
 new.freight_paise:=chosen.freight_paise;
 new.unloading_paise:=chosen.unloading_paise;
 new.total_paise:=chosen.total_paise;
 new.currency:='INR';
 new.status:='pending_confirmation';
 new.invoice_number:=null;
 new.created_at:=statement_timestamp();
 new.updated_at:=new.created_at;
 return new;
end $$;
revoke all on function public.neerva_order_prepare_insert() from public,anon,authenticated;
create trigger neerva_order_accept_offer before insert on public.orders
 for each row execute function public.neerva_order_prepare_insert();

-- The only updatable field is status, but row policies AND this trigger check
-- actor/tenant and the permitted transitions. No dealer marks delivery complete
-- and no customer can fabricate dealer confirmation.
create or replace function public.neerva_order_enforce_status()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,auth,pg_temp as $$
declare actor uuid := auth.uid(); is_admin boolean; is_dealer boolean; is_customer boolean;
begin
 if actor is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if new.status=old.status then return old; end if;
 is_admin:=public.has_platform_role(array['admin','super_admin']::public.platform_role[]);
 is_customer:=(old.customer_id=actor);
 is_dealer:=public.is_tenant_member(old.tenant_id,array['owner','manager','dispatch']::text[])
  and exists(select 1 from public.tenants t where t.id=old.tenant_id and t.status='active')
  and exists(select 1 from public.dealer_applications app
   where app.tenant_id=old.tenant_id and app.status='approved' and app.gstin_verification='verified');

 if not (
  (is_customer and ((old.status='pending_confirmation' and new.status='cancelled')
              or (old.status='out_for_delivery' and new.status='delivered')))
  or (is_dealer and ((old.status='pending_confirmation' and new.status in ('confirmed','declined'))
               or (old.status='confirmed' and new.status='preparing')
               or (old.status='preparing' and new.status='out_for_delivery')))
  or (is_admin and ((old.status='pending_confirmation' and new.status in ('confirmed','cancelled','declined'))
               or (old.status='confirmed' and new.status in ('preparing','cancelled'))
               or (old.status='preparing' and new.status in ('out_for_delivery','cancelled'))
               or (old.status='out_for_delivery' and new.status='cancelled')))
 ) then
  raise exception using errcode='42501',message='ORDER_TRANSITION_DENIED';
 end if;
 new.updated_at:=statement_timestamp();
 return new;
end $$;
revoke all on function public.neerva_order_enforce_status() from public,anon,authenticated;
create trigger neerva_order_status_guard before update on public.orders
 for each row execute function public.neerva_order_enforce_status();

create or replace function public.neerva_order_write_audit()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,auth,pg_temp as $$
begin
 if tg_op='INSERT' then
  update public.quote_requests set status='accepted'::public.rfq_status where id=new.quote_request_id;
 end if;
 insert into public.audit_logs(actor_id,tenant_id,action,object_type,object_id,safe_metadata)
 values(auth.uid(),new.tenant_id,
  case when tg_op='INSERT' then 'order.accepted_offer' else 'order.status_changed' end,
  'order',new.id::text,
  jsonb_build_object('status',new.status,'priorStatus',case when tg_op='UPDATE' then old.status else null end));
 return new;
end $$;
revoke all on function public.neerva_order_write_audit() from public,anon,authenticated;
create trigger neerva_order_audit_insert after insert on public.orders
 for each row execute function public.neerva_order_write_audit();
create trigger neerva_order_audit_update after update on public.orders
 for each row execute function public.neerva_order_write_audit();

comment on table public.orders is
 'Authenticated customer acceptance of an approved, current dealer RFQ offer; payment is never captured here. No GST invoice, confirmed delivery, or stock reservation implied.';
