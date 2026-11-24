-- Versioned admin-only marketplace fee policy. No charge before an explicit policy is published.
create table public.marketplace_fee_versions(
 id bigint generated always as identity primary key,
 fixed_paise bigint not null check(fixed_paise between 0 and 1000000),
 rate_bps integer not null check(rate_bps between 0 and 2000),
 cap_paise bigint not null check(cap_paise between 0 and 10000000),
 commission_bps integer not null check(commission_bps between 0 and 3000),
 reason text not null check(char_length(btrim(reason)) between 3 and 300),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.marketplace_fee_versions enable row level security;
revoke all on public.marketplace_fee_versions from public,anon,authenticated;
grant select on public.marketplace_fee_versions to authenticated;
grant insert(fixed_paise,rate_bps,cap_paise,commission_bps,reason) on public.marketplace_fee_versions to authenticated;
create policy marketplace_fee_read on public.marketplace_fee_versions for select to authenticated using ((select public.neerva_account_access_allowed()) and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy marketplace_fee_publish on public.marketplace_fee_versions for insert to authenticated with check (created_by=auth.uid() and (select public.neerva_account_access_allowed()) and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
-- Dealer-independent order intake. Existing accepted RFQ orders are unchanged.
-- Direct orders have no payment or confirmed rate until the customer approves the delivered total.
create table public.direct_orders (
 id uuid primary key default gen_random_uuid(),
 code text not null unique default ('ND-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 customer_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
 idempotency_key uuid not null,
 category text not null check(category in ('cement','steel','bricks-blocks','plumbing','electrical','paint','tiles','hardware','aggregates')),
 product_slug text not null check(product_slug ~ '^[a-z0-9-]{1,100}$'),
 product_name text not null check(char_length(product_name) between 2 and 240),
 quantity numeric(12,3) not null check(quantity>0 and quantity<=1000000),
 unit text not null check(unit in ('piece','bag','kg','quintal','tonne','cubic_metre','truck','bundle','length','coil','metre','litre','bucket','box','square_foot')),
 contact_name text not null check(char_length(btrim(contact_name)) between 2 and 100),
 phone text not null check(phone ~ '^[6-9][0-9]{9}$'),
 city text not null check(char_length(btrim(city)) between 2 and 80),
 pincode text not null check(pincode ~ '^[1-9][0-9]{5}$'),
 delivery_address text not null check(char_length(btrim(delivery_address)) between 12 and 300),
 notes text not null default '' check(char_length(notes)<=300),
 status text not null default 'received' check(status in ('received','sourcing','price_ready','confirmed','preparing','out_for_delivery','delivered','cancelled')),
 total_paise bigint check(total_paise between 1 and 20010000000),
 platform_fee_paise bigint not null default 0 check(platform_fee_paise between 0 and 10000000),
 fee_version_id bigint references public.marketplace_fee_versions(id),
 material_paise bigint check(material_paise between 1 and 5000000000),
 tax_paise bigint check(tax_paise between 0 and 5000000000),
 freight_paise bigint check(freight_paise between 0 and 5000000000),
 unloading_paise bigint check(unloading_paise between 0 and 5000000000),
 customer_terms text check(char_length(customer_terms) between 10 and 500),
 procurement_note text check(char_length(procurement_note)<=500),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((total_paise is null and material_paise is null and tax_paise is null and freight_paise is null and unloading_paise is null) or (total_paise is not null and material_paise is not null and tax_paise is not null and freight_paise is not null and unloading_paise is not null and total_paise=material_paise+tax_paise+freight_paise+unloading_paise+platform_fee_paise)),
 unique(customer_id,idempotency_key)
);
create index direct_orders_customer_created on public.direct_orders(customer_id,created_at desc);
create index direct_orders_status_created on public.direct_orders(status,created_at desc);
alter table public.direct_orders enable row level security;
revoke all on public.direct_orders from public,anon,authenticated;
-- Procurement notes are intentionally not exposed to the customer or browser.
grant select(id,code,customer_id,idempotency_key,category,product_slug,product_name,quantity,unit,contact_name,phone,city,pincode,delivery_address,notes,status,total_paise,platform_fee_paise,fee_version_id,material_paise,tax_paise,freight_paise,unloading_paise,customer_terms,created_at,updated_at) on public.direct_orders to authenticated;
grant insert(idempotency_key,category,product_slug,product_name,quantity,unit,contact_name,phone,city,pincode,delivery_address,notes) on public.direct_orders to authenticated;
grant update(status,total_paise,material_paise,tax_paise,freight_paise,unloading_paise,customer_terms) on public.direct_orders to authenticated;
create policy direct_orders_read on public.direct_orders for select to authenticated using (
 (select public.neerva_account_access_allowed()) and (customer_id=(select auth.uid()) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))));
create policy direct_orders_insert on public.direct_orders for insert to authenticated with check (
 customer_id=(select auth.uid()) and (select public.neerva_account_access_allowed()) and status='received' and total_paise is null and customer_terms is null);
create policy direct_orders_update on public.direct_orders for update to authenticated using (
 (select public.neerva_account_access_allowed()) and (customer_id=(select auth.uid()) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))))
 with check ((select public.neerva_account_access_allowed()) and (customer_id=(select auth.uid()) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))));
create function public.neerva_direct_order_guard() returns trigger language plpgsql security invoker set search_path=pg_catalog,public,auth as $$
declare admin boolean:=coalesce(public.has_platform_role(array['admin','super_admin']::public.platform_role[]),false);
 fee public.marketplace_fee_versions%rowtype;
begin
 if auth.uid() is null or not coalesce(public.neerva_account_access_allowed(),false) then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if tg_op='INSERT' then
  if new.customer_id<>auth.uid() or new.status<>'received' or new.total_paise is not null or new.customer_terms is not null then raise exception using errcode='42501',message='INVALID_INTAKE'; end if;
  if not ((new.category='cement' and new.unit in ('bag','tonne')) or (new.category='steel' and new.unit in ('kg','quintal','tonne','piece','bundle')) or (new.category='bricks-blocks' and new.unit in ('piece','bundle','truck')) or (new.category='plumbing' and new.unit in ('length','piece','bundle','metre')) or (new.category='electrical' and new.unit in ('coil','metre','piece','bundle','kg')) or (new.category='aggregates' and new.unit in ('cubic_metre','truck','tonne')) or (new.category='paint' and new.unit in ('litre','kg','bucket','piece')) or (new.category='tiles' and new.unit in ('box','square_foot','piece')) or (new.category='hardware' and new.unit in ('piece','box','kg','bag','bundle'))) then raise exception using errcode='23514',message='INVALID_UNIT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  if (select count(*) from public.direct_orders where customer_id=auth.uid() and created_at>statement_timestamp()-interval '1 minute')>=10 then raise exception using errcode='23514',message='ORDER_RATE_LIMIT'; end if;
  return new;
 end if;
 if new.total_paise is distinct from old.total_paise or new.material_paise is distinct from old.material_paise or new.tax_paise is distinct from old.tax_paise or new.freight_paise is distinct from old.freight_paise or new.unloading_paise is distinct from old.unloading_paise or new.customer_terms is distinct from old.customer_terms then
  if not admin or old.status not in ('received','sourcing') or new.status<>'price_ready' or new.total_paise is null or new.customer_terms is null then raise exception using errcode='42501',message='PRICE_CHANGE_DENIED'; end if;
 end if;
 if not ((admin and ((old.status='received' and new.status='sourcing') or (old.status in ('received','sourcing') and new.status='price_ready' and new.total_paise is not null and new.customer_terms is not null) or (old.status='confirmed' and new.status='preparing') or (old.status='preparing' and new.status='out_for_delivery') or (old.status in ('received','sourcing','price_ready','confirmed','preparing','out_for_delivery') and new.status='cancelled'))) or (old.customer_id=auth.uid() and ((old.status='price_ready' and new.status='confirmed') or (old.status in ('received','sourcing','price_ready') and new.status='cancelled') or (old.status='out_for_delivery' and new.status='delivered')))) then raise exception using errcode='42501',message='TRANSITION_DENIED'; end if;
 if new.status='price_ready' and old.status in ('received','sourcing') then
  select * into fee from public.marketplace_fee_versions order by id desc limit 1;
  new.platform_fee_paise:=case when fee.id is null then 0 else least(fee.cap_paise,fee.fixed_paise+round(new.material_paise::numeric*fee.rate_bps/10000)::bigint) end;
  new.fee_version_id:=fee.id;
  new.total_paise:=new.material_paise+new.tax_paise+new.freight_paise+new.unloading_paise+new.platform_fee_paise;
 end if;
 new.updated_at=statement_timestamp();return new;
end $$;
revoke all on function public.neerva_direct_order_guard() from public,anon,authenticated;
create trigger direct_orders_guard before insert or update on public.direct_orders for each row execute function public.neerva_direct_order_guard();
-- Immutable status history; trigger writes in the same transaction. No direct client writes.
create table public.direct_order_events(id bigint generated always as identity primary key,order_id uuid not null references public.direct_orders(id) on delete restrict,status text not null,created_at timestamptz not null default now());
create index direct_order_events_order_time on public.direct_order_events(order_id,created_at);
alter table public.direct_order_events enable row level security;
revoke all on public.direct_order_events from public,anon,authenticated;
grant select on public.direct_order_events to authenticated;
create policy direct_order_events_read on public.direct_order_events for select to authenticated using (exists(select 1 from public.direct_orders o where o.id=order_id));
create schema if not exists neerva_private;
revoke all on schema neerva_private from public,anon,authenticated;
create function neerva_private.direct_order_event() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 insert into public.direct_order_events(order_id,status) values(new.id,new.status);
 return new;
end $$;
revoke all on function neerva_private.direct_order_event() from public,anon,authenticated;
create trigger direct_order_events_write after insert or update of status on public.direct_orders for each row execute function neerva_private.direct_order_event();

-- Dealer price submissions must not self-publish or edit a published price.
create function public.neerva_guard_dealer_price() returns trigger language plpgsql security invoker set search_path=pg_catalog,public,auth as $$
begin
 if coalesce(public.has_platform_role(array['admin','super_admin']::public.platform_role[]),false) then return case when tg_op='DELETE' then old else new end; end if;
 if auth.uid() is null or not coalesce(public.neerva_account_access_allowed(),false) then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if tg_op='DELETE' then raise exception using errcode='42501',message='PRICE_DELETE_DENIED'; end if;
 if new.tenant_id is null or new.branch_id is null or not public.is_tenant_member(new.tenant_id,array['owner','manager']::text[]) or not exists(select 1 from public.merchant_branches b where b.id=new.branch_id and b.tenant_id=new.tenant_id and b.approved) then raise exception using errcode='42501',message='DEALER_SCOPE_DENIED'; end if;
 if new.status not in ('draft','pending_approval') or (tg_op='UPDATE' and old.status not in ('draft','pending_approval')) then raise exception using errcode='42501',message='ADMIN_PUBLICATION_REQUIRED'; end if;
 if tg_op='INSERT' then new.created_by:=auth.uid(); end if;
 return new;
end $$;
revoke all on function public.neerva_guard_dealer_price() from public,anon,authenticated;
create trigger neerva_dealer_price_guard before insert or update or delete on public.pricing_rules for each row execute function public.neerva_guard_dealer_price();

-- Read-only, narrow seller comparison. Does not expose exact stock, private rates, KYC or contact details.
-- Authenticated entry point delegates to a non-exposed schema.
grant usage on schema neerva_private to authenticated;
create function neerva_private.compare_dealer_prices(p_category text,p_slug text,p_pin text,p_qty numeric)
returns table(seller text,branch text,sku text,unit text,unit_paise bigint,material_paise bigint,fee_paise bigint,valid_to timestamptz)
language plpgsql stable security definer set search_path=pg_catalog,public,auth as $$
begin
 if auth.uid() is null or not coalesce(public.neerva_account_access_allowed(),false) then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if p_pin !~ '^[1-9][0-9]{5}$' or p_qty is null or p_qty<=0 or p_qty>1000000 or length(p_slug)>100 or length(p_category)>40 then raise exception using errcode='22023',message='INVALID_SEARCH'; end if;
 return query
 with fee as (select f.fixed_paise,f.rate_bps,f.cap_paise from public.marketplace_fee_versions f order by id desc limit 1),
 candidates as (
 select distinct on (r.tenant_id,v.id) t.business_name::text seller,b.name::text branch,v.sku::text sku,v.unit::text unit,r.amount_paise,
 round(r.amount_paise*p_qty)::bigint subtotal,r.valid_to
 from public.pricing_rules r
 join public.product_variants v on v.id=r.variant_id and v.status='published' and v.unit=r.unit
 join public.products p on p.id=v.product_id and p.status='published'
 join public.categories c on c.id=p.category_id and c.status='published' and c.pricing_mode='public'
 join public.tenants t on t.id=r.tenant_id and t.status='active'
 join public.merchant_branches b on b.id=r.branch_id and b.tenant_id=t.id and b.approved
 join public.inventory i on i.branch_id=b.id and i.variant_id=v.id and i.unit=v.unit and i.available_quantity>=p_qty
 where c.slug=p_category and p.slug=p_slug and r.status='published' and r.visibility='public' and r.currency='INR' and r.amount_paise>0 and r.minimum_quantity<=p_qty and r.valid_from<=now() and (r.valid_to is null or r.valid_to>now()) and (r.pincode_prefix is null or p_pin like r.pincode_prefix||'%')
 and exists(select 1 from public.dealer_applications a join public.dealer_service_pincodes sp on sp.application_id=a.id where a.tenant_id=t.id and a.status='approved' and a.gstin_verification='verified' and sp.pincode=p_pin)
 order by r.tenant_id,v.id,length(coalesce(r.pincode_prefix,'')) desc,r.minimum_quantity desc,r.valid_from desc,r.version desc,r.id
 )
 select q.seller,q.branch,q.sku,q.unit,q.amount_paise,q.subtotal,coalesce((select least(f.cap_paise,f.fixed_paise+round(q.subtotal::numeric*f.rate_bps/10000)::bigint) from fee f),0),q.valid_to
 from candidates q order by q.sku,q.subtotal,q.seller limit 50;
end $$;
revoke all on function neerva_private.compare_dealer_prices(text,text,text,numeric) from public,anon,authenticated;
grant execute on function neerva_private.compare_dealer_prices(text,text,text,numeric) to authenticated;
create function public.neerva_compare_dealer_prices(p_category text,p_slug text,p_pin text,p_qty numeric)
returns table(seller text,branch text,sku text,unit text,unit_paise bigint,material_paise bigint,fee_paise bigint,valid_to timestamptz)
language sql stable security invoker set search_path=pg_catalog,neerva_private as $$ select * from neerva_private.compare_dealer_prices(p_category,p_slug,p_pin,p_qty) $$;
revoke all on function public.neerva_compare_dealer_prices(text,text,text,numeric) from public,anon,authenticated;
grant execute on function public.neerva_compare_dealer_prices(text,text,text,numeric) to authenticated;
