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
 line_items jsonb not null check(jsonb_typeof(line_items)='array' and jsonb_array_length(line_items) between 1 and 25 and octet_length(line_items::text)<=16000),
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
grant select(id,code,customer_id,idempotency_key,category,product_slug,product_name,quantity,unit,line_items,contact_name,phone,city,pincode,delivery_address,notes,status,total_paise,platform_fee_paise,fee_version_id,material_paise,tax_paise,freight_paise,unloading_paise,customer_terms,created_at,updated_at) on public.direct_orders to authenticated;
grant insert(idempotency_key,category,product_slug,product_name,quantity,unit,line_items,contact_name,phone,city,pincode,delivery_address,notes) on public.direct_orders to authenticated;
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
 item jsonb;
begin
 if auth.uid() is null or not coalesce(public.neerva_account_access_allowed(),false) then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if tg_op='INSERT' then
  if new.customer_id<>auth.uid() or new.status<>'received' or new.total_paise is not null or new.customer_terms is not null then raise exception using errcode='42501',message='INVALID_INTAKE'; end if;
  if not ((new.category='cement' and new.unit in ('bag','tonne')) or (new.category='steel' and new.unit in ('kg','quintal','tonne','piece','bundle')) or (new.category='bricks-blocks' and new.unit in ('piece','bundle','truck')) or (new.category='plumbing' and new.unit in ('length','piece','bundle','metre')) or (new.category='electrical' and new.unit in ('coil','metre','piece','bundle','kg')) or (new.category='aggregates' and new.unit in ('cubic_metre','truck','tonne')) or (new.category='paint' and new.unit in ('litre','kg','bucket','piece')) or (new.category='tiles' and new.unit in ('box','square_foot','piece')) or (new.category='hardware' and new.unit in ('piece','box','kg','bag','bundle'))) then raise exception using errcode='23514',message='INVALID_UNIT'; end if;
  if new.line_items->0->>'category' is distinct from new.category or new.line_items->0->>'productSlug' is distinct from new.product_slug or new.line_items->0->>'unit' is distinct from new.unit or (new.line_items->0->>'quantity')::numeric is distinct from new.quantity then raise exception using errcode='23514',message='INVALID_FIRST_ITEM'; end if;
  for item in select value from jsonb_array_elements(new.line_items) loop
   if jsonb_typeof(item)<>'object' or not (item ?& array['category','productSlug','productName','quantity','unit']) or (select count(*) from jsonb_object_keys(item))<>5 or coalesce(item->>'productSlug','') !~ '^[a-z0-9-]{1,100}$' or char_length(coalesce(item->>'productName','')) not between 2 and 240 or jsonb_typeof(item->'quantity') is distinct from 'number' or (item->>'quantity')::numeric not between .001 and 1000000 or round((item->>'quantity')::numeric,3)<>(item->>'quantity')::numeric then raise exception using errcode='23514',message='INVALID_CART_ITEM'; end if;
   if not coalesce(case item->>'category' when 'cement' then item->>'unit' in ('bag','tonne') when 'steel' then item->>'unit' in ('kg','quintal','tonne','piece','bundle') when 'bricks-blocks' then item->>'unit' in ('piece','bundle','truck') when 'plumbing' then item->>'unit' in ('length','piece','bundle','metre') when 'electrical' then item->>'unit' in ('coil','metre','piece','bundle','kg') when 'aggregates' then item->>'unit' in ('cubic_metre','truck','tonne') when 'paint' then item->>'unit' in ('litre','kg','bucket','piece') when 'tiles' then item->>'unit' in ('box','square_foot','piece') when 'hardware' then item->>'unit' in ('piece','box','kg','bag','bundle') else false end,false) then raise exception using errcode='23514',message='INVALID_CART_UNIT'; end if;
  end loop;
  if (select count(distinct (v->>'category',v->>'productSlug',v->>'unit')) from jsonb_array_elements(new.line_items) v)<>jsonb_array_length(new.line_items) then raise exception using errcode='23514',message='DUPLICATE_CART_ITEM'; end if;
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
 if coalesce(public.has_platform_role(array['admin','super_admin']::public.platform_role[]),false) then if tg_op='DELETE' then return old; end if; return new; end if;
 if auth.uid() is null or not coalesce(public.neerva_account_access_allowed(),false) then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if tg_op='DELETE' then raise exception using errcode='42501',message='PRICE_DELETE_DENIED'; end if;
 if new.tenant_id is null or new.branch_id is null or not public.is_tenant_member(new.tenant_id,array['owner','manager']::text[]) or not exists(select 1 from public.merchant_branches b where b.id=new.branch_id and b.tenant_id=new.tenant_id and b.approved) then raise exception using errcode='42501',message='DEALER_SCOPE_DENIED'; end if;
 if new.status not in ('draft','pending_approval') or (tg_op='UPDATE' and old.status not in ('draft','pending_approval')) then raise exception using errcode='42501',message='ADMIN_PUBLICATION_REQUIRED'; end if;
 if tg_op='INSERT' then new.created_by:=auth.uid(); end if;
 return new;
end $$;
revoke all on function public.neerva_guard_dealer_price() from public,anon,authenticated;
create trigger neerva_dealer_price_guard before insert or update or delete on public.pricing_rules for each row execute function public.neerva_guard_dealer_price();

-- Versioned branch delivery settings: dealer submits; only administrator approves.
create table public.dealer_delivery_versions(
 id bigint generated always as identity primary key,
 branch_id uuid not null references public.merchant_branches(id),
 tenant_id uuid not null references public.tenants(id),
 pincode text not null check(pincode ~ '^[1-9][0-9]{5}$'),
 freight_paise bigint not null check(freight_paise between 0 and 5000000000),
 unloading_paise bigint not null check(unloading_paise between 0 and 5000000000),
 minimum_material_paise bigint not null check(minimum_material_paise between 0 and 5000000000),
 lead_days integer not null check(lead_days between 0 and 90),
 accepting_orders boolean not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
 foreign key(branch_id,tenant_id) references public.merchant_branches(id,tenant_id)
);
create index dealer_delivery_scope on public.dealer_delivery_versions(branch_id,pincode,id desc);
alter table public.dealer_delivery_versions enable row level security;
revoke all on public.dealer_delivery_versions from public,anon,authenticated;
grant select on public.dealer_delivery_versions to authenticated;
grant insert(branch_id,tenant_id,pincode,freight_paise,unloading_paise,minimum_material_paise,lead_days,accepting_orders) on public.dealer_delivery_versions to authenticated;
grant update(status) on public.dealer_delivery_versions to authenticated;
create policy dealer_delivery_read on public.dealer_delivery_versions for select to authenticated using ((select public.neerva_account_access_allowed()) and (public.is_tenant_member(tenant_id,array['owner','manager']::text[]) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))));
create policy dealer_delivery_submit on public.dealer_delivery_versions for insert to authenticated with check (
 created_by=auth.uid() and status='pending' and reviewed_by is null and reviewed_at is null and (select public.neerva_account_access_allowed()) and public.is_tenant_member(tenant_id,array['owner','manager']::text[]) and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active') and exists(select 1 from public.merchant_branches b where b.id=branch_id and b.tenant_id=dealer_delivery_versions.tenant_id and b.approved));
create policy dealer_delivery_review on public.dealer_delivery_versions for update to authenticated using (status='pending' and (select public.neerva_account_access_allowed()) and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))) with check(status in ('approved','rejected') and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create function public.neerva_delivery_review_stamp() returns trigger language plpgsql security invoker set search_path=pg_catalog,public,auth as $$ begin new.reviewed_by:=auth.uid();new.reviewed_at:=statement_timestamp();return new;end $$;
revoke all on function public.neerva_delivery_review_stamp() from public,anon,authenticated;
create trigger dealer_delivery_review_stamp before update on public.dealer_delivery_versions for each row execute function public.neerva_delivery_review_stamp();
-- Explicit reviewed tax treatment per exact SKU. Never guess GST from a broad category.
create table public.sku_tax_versions(
 id bigint generated always as identity primary key,
 variant_id uuid not null references public.product_variants(id),
 hsn text not null check(hsn ~ '^[0-9]{4,8}$'),
 rate_bps integer not null check(rate_bps between 0 and 10000),
 price_includes_tax boolean not null,
 reason text not null check(char_length(btrim(reason)) between 3 and 300),
 created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now()
);
create index sku_tax_latest on public.sku_tax_versions(variant_id,id desc);
alter table public.sku_tax_versions enable row level security;
revoke all on public.sku_tax_versions from public,anon,authenticated;
grant select on public.sku_tax_versions to authenticated;
grant insert(variant_id,hsn,rate_bps,price_includes_tax,reason) on public.sku_tax_versions to authenticated;
create policy sku_tax_admin_read on public.sku_tax_versions for select to authenticated using ((select public.neerva_account_access_allowed()) and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy sku_tax_admin_publish on public.sku_tax_versions for insert to authenticated with check(created_by=auth.uid() and (select public.neerva_account_access_allowed()) and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));

-- Dealer catalog proposals are private; approval never creates an unverified global SKU.
create table public.dealer_product_requests(
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 branch_id uuid not null references public.merchant_branches(id),
 category_slug text not null check(category_slug in ('cement','steel','bricks-blocks','plumbing','electrical','paint','tiles','hardware','aggregates')),
 product_name text not null check(char_length(btrim(product_name)) between 2 and 160),
 brand_name text not null check(char_length(btrim(brand_name)) between 1 and 100),
 model_details text not null check(char_length(btrim(model_details)) between 5 and 400),
 source_url text check(char_length(source_url)<=500 and source_url ~ '^https://'),
 status text not null default 'pending' check(status in ('pending','accepted','rejected')),
 review_note text check(char_length(btrim(review_note)) between 3 and 300),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 reviewed_by uuid references auth.users(id),reviewed_at timestamptz,
 foreign key(branch_id,tenant_id) references public.merchant_branches(id,tenant_id)
);
create index dealer_product_request_scope on public.dealer_product_requests(tenant_id,created_at desc);
create unique index dealer_product_request_pending_unique on public.dealer_product_requests(branch_id,category_slug,lower(btrim(product_name)),lower(btrim(brand_name)),lower(btrim(model_details))) where status='pending';
alter table public.dealer_product_requests enable row level security;
revoke all on public.dealer_product_requests from public,anon,authenticated;
grant select on public.dealer_product_requests to authenticated;
grant insert(tenant_id,branch_id,category_slug,product_name,brand_name,model_details,source_url) on public.dealer_product_requests to authenticated;
grant update(status,review_note) on public.dealer_product_requests to authenticated;
create policy dealer_product_request_read on public.dealer_product_requests for select to authenticated using ((select public.neerva_account_access_allowed()) and (public.is_tenant_member(tenant_id,array['owner','manager']::text[]) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))));
create policy dealer_product_request_create on public.dealer_product_requests for insert to authenticated with check (
 created_by=auth.uid() and status='pending' and reviewed_at is null and reviewed_by is null and review_note is null and (select public.neerva_account_access_allowed()) and public.is_tenant_member(tenant_id,array['owner','manager']::text[]) and exists(select 1 from public.tenants t where t.id=dealer_product_requests.tenant_id and t.status='active') and exists(select 1 from public.merchant_branches b where b.id=branch_id and b.tenant_id=dealer_product_requests.tenant_id and b.approved));
create policy dealer_product_request_review on public.dealer_product_requests for update to authenticated using(status='pending' and (select public.neerva_account_access_allowed()) and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))) with check(status in ('accepted','rejected') and review_note is not null and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create trigger dealer_product_request_stamp before update on public.dealer_product_requests for each row execute function public.neerva_delivery_review_stamp();
-- Separate stock from availability: pausing a SKU never destroys inventory or approved prices.
create table public.dealer_listing_controls(
 branch_id uuid not null references public.merchant_branches(id),
 variant_id uuid not null references public.product_variants(id),
 tenant_id uuid not null references public.tenants(id),
 active boolean not null default true,
 updated_at timestamptz not null default now(),
 primary key(branch_id,variant_id),
 foreign key(branch_id,tenant_id) references public.merchant_branches(id,tenant_id)
);
alter table public.dealer_listing_controls enable row level security;
revoke all on public.dealer_listing_controls from public,anon,authenticated;
grant select on public.dealer_listing_controls to authenticated;
grant insert(branch_id,variant_id,tenant_id,active) on public.dealer_listing_controls to authenticated;
grant update(active) on public.dealer_listing_controls to authenticated;
create policy dealer_listing_read on public.dealer_listing_controls for select to authenticated using ((select public.neerva_account_access_allowed()) and (public.is_tenant_member(tenant_id,array['owner','manager']::text[]) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))));
create policy dealer_listing_insert on public.dealer_listing_controls for insert to authenticated with check ((select public.neerva_account_access_allowed()) and public.is_tenant_member(tenant_id,array['owner','manager']::text[]) and exists(select 1 from public.tenants t where t.id=dealer_listing_controls.tenant_id and t.status='active') and exists(select 1 from public.merchant_branches b where b.id=branch_id and b.tenant_id=dealer_listing_controls.tenant_id and b.approved) and exists(select 1 from public.product_variants v where v.id=variant_id and v.status='published'));
create policy dealer_listing_update on public.dealer_listing_controls for update to authenticated using ((select public.neerva_account_access_allowed()) and public.is_tenant_member(tenant_id,array['owner','manager']::text[])) with check ((select public.neerva_account_access_allowed()) and public.is_tenant_member(tenant_id,array['owner','manager']::text[]) and exists(select 1 from public.tenants t where t.id=dealer_listing_controls.tenant_id and t.status='active') and exists(select 1 from public.merchant_branches b where b.id=branch_id and b.tenant_id=dealer_listing_controls.tenant_id and b.approved));
create function public.neerva_listing_stamp() returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$ begin new.updated_at:=statement_timestamp();return new;end $$;
revoke all on function public.neerva_listing_stamp() from public,anon,authenticated;
create trigger dealer_listing_stamp before update on public.dealer_listing_controls for each row execute function public.neerva_listing_stamp();
-- Read-only, narrow seller comparison. Does not expose exact stock, private rates, KYC or contact details.
-- Authenticated entry point delegates to a non-exposed schema.
grant usage on schema neerva_private to authenticated;
create function neerva_private.compare_dealer_prices(p_category text,p_slug text,p_pin text,p_qty numeric)
returns table(seller text,branch text,sku text,unit text,unit_paise bigint,material_paise bigint,fee_paise bigint,valid_to timestamptz,branch_id uuid,freight_paise bigint,unloading_paise bigint,tax_paise bigint,estimated_total_paise bigint,lead_days integer)
language plpgsql stable security definer set search_path=pg_catalog,public,auth as $$
begin
 if auth.uid() is null or not coalesce(public.neerva_account_access_allowed(),false) then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if p_pin !~ '^[1-9][0-9]{5}$' or p_qty is null or p_qty<=0 or p_qty>1000000 or length(p_slug)>100 or length(p_category)>40 then raise exception using errcode='22023',message='INVALID_SEARCH'; end if;
 return query
 with fee as (select f.fixed_paise,f.rate_bps,f.cap_paise from public.marketplace_fee_versions f order by id desc limit 1),
 candidates as (
 select distinct on (r.tenant_id,v.id) t.business_name::text seller,b.name::text branch,v.sku::text sku,v.unit::text unit,r.amount_paise,
 round(r.amount_paise*p_qty)::bigint subtotal,r.valid_to,b.id bid,d.freight_paise freight,d.unloading_paise unloading,d.lead_days days,case when tx.id is null then null when tx.price_includes_tax then 0::bigint else round(round(r.amount_paise*p_qty)*tx.rate_bps/10000)::bigint end extra_tax
 from public.pricing_rules r
 join public.product_variants v on v.id=r.variant_id and v.status='published' and v.unit=r.unit
 join public.products p on p.id=v.product_id and p.status='published'
 join public.categories c on c.id=p.category_id and c.status='published' and c.pricing_mode='public'
 join public.tenants t on t.id=r.tenant_id and t.status='active'
 join public.merchant_branches b on b.id=r.branch_id and b.tenant_id=t.id and b.approved
 join public.inventory i on i.branch_id=b.id and i.variant_id=v.id and i.unit=v.unit and i.available_quantity>=p_qty
 left join lateral (select dv.* from public.dealer_delivery_versions dv where dv.branch_id=b.id and dv.pincode=p_pin and dv.status='approved' order by dv.id desc limit 1) d on true
 left join lateral (select tv.* from public.sku_tax_versions tv where tv.variant_id=v.id order by tv.id desc limit 1) tx on true
 where not exists(select 1 from public.dealer_listing_controls lc where lc.branch_id=b.id and lc.variant_id=v.id and not lc.active) and (d.id is null or (d.accepting_orders and round(r.amount_paise*p_qty)>=d.minimum_material_paise)) and c.slug=p_category and p.slug=p_slug and c.slug<>'aggregates' and r.status='published' and r.visibility='public' and r.currency='INR' and r.amount_paise>0 and r.minimum_quantity<=p_qty and r.valid_from<=now() and (r.valid_to is null or r.valid_to>now()) and (r.pincode_prefix is null or p_pin like r.pincode_prefix||'%')
 and exists(select 1 from public.dealer_applications a join public.dealer_service_pincodes sp on sp.application_id=a.id where a.tenant_id=t.id and a.status='approved' and a.gstin_verification='verified' and sp.pincode=p_pin)
 order by r.tenant_id,v.id,(d.id is not null) desc,length(coalesce(r.pincode_prefix,'')) desc,r.minimum_quantity desc,r.valid_from desc,r.version desc,r.id
 )
 select q.seller,q.branch,q.sku,q.unit,q.amount_paise,q.subtotal,fv.amount,q.valid_to,q.bid,q.freight,q.unloading,q.extra_tax,
 case when q.freight is not null and q.unloading is not null and q.extra_tax is not null then q.subtotal+fv.amount+q.freight+q.unloading+q.extra_tax else null end,q.days
 from candidates q cross join lateral (select coalesce((select least(f.cap_paise,f.fixed_paise+round(q.subtotal::numeric*f.rate_bps/10000)::bigint) from fee f),0) amount) fv
 order by q.sku,(case when q.freight is not null and q.unloading is not null and q.extra_tax is not null then q.subtotal+fv.amount+q.freight+q.unloading+q.extra_tax else null end) nulls last,q.subtotal,q.seller limit 50;
end $$;
revoke all on function neerva_private.compare_dealer_prices(text,text,text,numeric) from public,anon,authenticated;
grant execute on function neerva_private.compare_dealer_prices(text,text,text,numeric) to authenticated;
create function public.neerva_compare_dealer_prices(p_category text,p_slug text,p_pin text,p_qty numeric)
returns table(seller text,branch text,sku text,unit text,unit_paise bigint,material_paise bigint,fee_paise bigint,valid_to timestamptz,branch_id uuid,freight_paise bigint,unloading_paise bigint,tax_paise bigint,estimated_total_paise bigint,lead_days integer)
language sql stable security invoker set search_path=pg_catalog,neerva_private as $$ select * from neerva_private.compare_dealer_prices(p_category,p_slug,p_pin,p_qty) $$;
revoke all on function public.neerva_compare_dealer_prices(text,text,text,numeric) from public,anon,authenticated;
grant execute on function public.neerva_compare_dealer_prices(text,text,text,numeric) to authenticated;

-- Append-only admin operational records. No funds are moved by these entries.
create table public.direct_order_operations(
 id bigint generated always as identity primary key,
 order_id uuid not null references public.direct_orders(id) on delete restrict,
 kind text not null check(kind in ('procurement','delivery_cost','unloading_cost','cod_received','bank_received','refund_paid')),
 amount_paise bigint not null check(amount_paise between 1 and 20010000000),
 evidence_ref text not null check(char_length(btrim(evidence_ref)) between 3 and 150),
 note text not null check(char_length(btrim(note)) between 3 and 300),
 actor uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 unique(order_id,kind,evidence_ref)
);
create index direct_order_operations_order on public.direct_order_operations(order_id,id);
alter table public.direct_order_operations enable row level security;
revoke all on public.direct_order_operations from public,anon,authenticated;
grant select on public.direct_order_operations to authenticated;
grant insert(order_id,kind,amount_paise,evidence_ref,note) on public.direct_order_operations to authenticated;
create policy direct_operations_read on public.direct_order_operations for select to authenticated using ((select public.neerva_account_access_allowed()) and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy direct_operations_write on public.direct_order_operations for insert to authenticated with check (actor=auth.uid() and (select public.neerva_account_access_allowed()) and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create function public.neerva_direct_operations_guard() returns trigger language plpgsql security invoker set search_path=pg_catalog,public,auth as $$
declare order_status text; due bigint; received numeric; refunded numeric;
begin
 if auth.uid() is null or not coalesce(public.neerva_account_access_allowed(),false) or not coalesce(public.has_platform_role(array['admin','super_admin']::public.platform_role[]),false) then raise exception using errcode='42501',message='ADMIN_REQUIRED';end if;
 perform pg_advisory_xact_lock(hashtextextended(new.order_id::text,9));
 select o.status,o.total_paise into order_status,due from public.direct_orders o where o.id=new.order_id for update;
 if not found then raise exception using errcode='23503',message='ORDER_NOT_FOUND';end if;
 if new.kind in ('procurement','delivery_cost','unloading_cost') then
  if order_status not in ('confirmed','preparing','out_for_delivery','delivered','cancelled') or due is null then raise exception using errcode='23514',message='ORDER_NOT_CONFIRMED';end if;
 else
  select coalesce(sum(case when e.kind in ('cod_received','bank_received') then e.amount_paise else 0 end),0),coalesce(sum(case when e.kind='refund_paid' then e.amount_paise else 0 end),0) into received,refunded from public.direct_order_operations e where e.order_id=new.order_id;
  if new.kind in ('cod_received','bank_received') then
   if due is null or (new.kind='cod_received' and order_status not in ('out_for_delivery','delivered')) or (new.kind='bank_received' and order_status not in ('confirmed','preparing','out_for_delivery','delivered')) or received-refunded+new.amount_paise>due then raise exception using errcode='23514',message='INVALID_COLLECTION';end if;
  elsif refunded+new.amount_paise>received then raise exception using errcode='23514',message='REFUND_EXCEEDS_COLLECTION';end if;
 end if;
 return new;
end $$;
revoke all on function public.neerva_direct_operations_guard() from public,anon,authenticated;
create trigger direct_operations_guard before insert on public.direct_order_operations for each row execute function public.neerva_direct_operations_guard();
