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
 total_paise bigint check(total_paise between 1 and 20000000000),
 customer_terms text check(char_length(customer_terms) between 10 and 500),
 procurement_note text check(char_length(procurement_note)<=500),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(customer_id,idempotency_key)
);
create index direct_orders_customer_created on public.direct_orders(customer_id,created_at desc);
create index direct_orders_status_created on public.direct_orders(status,created_at desc);
alter table public.direct_orders enable row level security;
revoke all on public.direct_orders from public,anon,authenticated;
-- Procurement notes are intentionally not exposed to the customer or browser.
grant select(id,code,customer_id,idempotency_key,category,product_slug,product_name,quantity,unit,contact_name,phone,city,pincode,delivery_address,notes,status,total_paise,customer_terms,created_at,updated_at) on public.direct_orders to authenticated;
grant insert(idempotency_key,category,product_slug,product_name,quantity,unit,contact_name,phone,city,pincode,delivery_address,notes) on public.direct_orders to authenticated;
grant update(status,total_paise,customer_terms) on public.direct_orders to authenticated;
create policy direct_orders_read on public.direct_orders for select to authenticated using (
 (select public.neerva_account_access_allowed()) and (customer_id=(select auth.uid()) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))));
create policy direct_orders_insert on public.direct_orders for insert to authenticated with check (
 customer_id=(select auth.uid()) and (select public.neerva_account_access_allowed()) and status='received' and total_paise is null and customer_terms is null);
create policy direct_orders_update on public.direct_orders for update to authenticated using (
 (select public.neerva_account_access_allowed()) and (customer_id=(select auth.uid()) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))))
 with check ((select public.neerva_account_access_allowed()) and (customer_id=(select auth.uid()) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))));
create function public.neerva_direct_order_guard() returns trigger language plpgsql security invoker set search_path=pg_catalog,public,auth as $$
declare admin boolean:=coalesce(public.has_platform_role(array['admin','super_admin']::public.platform_role[]),false);
begin
 if auth.uid() is null or not coalesce(public.neerva_account_access_allowed(),false) then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if tg_op='INSERT' then
  if new.customer_id<>auth.uid() or new.status<>'received' or new.total_paise is not null or new.customer_terms is not null then raise exception using errcode='42501',message='INVALID_INTAKE'; end if;
  if not ((new.category='cement' and new.unit in ('bag','tonne')) or (new.category='steel' and new.unit in ('kg','quintal','tonne','piece','bundle')) or (new.category='bricks-blocks' and new.unit in ('piece','bundle','truck')) or (new.category='plumbing' and new.unit in ('length','piece','bundle','metre')) or (new.category='electrical' and new.unit in ('coil','metre','piece','bundle','kg')) or (new.category='aggregates' and new.unit in ('cubic_metre','truck','tonne')) or (new.category='paint' and new.unit in ('litre','kg','bucket','piece')) or (new.category='tiles' and new.unit in ('box','square_foot','piece')) or (new.category='hardware' and new.unit in ('piece','box','kg','bag','bundle'))) then raise exception using errcode='23514',message='INVALID_UNIT'; end if;
  return new;
 end if;
 if new.total_paise is distinct from old.total_paise or new.customer_terms is distinct from old.customer_terms then
  if not admin or old.status not in ('received','sourcing') or new.status<>'price_ready' or new.total_paise is null or new.customer_terms is null then raise exception using errcode='42501',message='PRICE_CHANGE_DENIED'; end if;
 end if;
 if not ((admin and ((old.status='received' and new.status='sourcing') or (old.status in ('received','sourcing') and new.status='price_ready' and new.total_paise is not null and new.customer_terms is not null) or (old.status='confirmed' and new.status='preparing') or (old.status='preparing' and new.status='out_for_delivery') or (old.status in ('received','sourcing','price_ready','confirmed','preparing','out_for_delivery') and new.status='cancelled'))) or (old.customer_id=auth.uid() and ((old.status='price_ready' and new.status='confirmed') or (old.status in ('received','sourcing','price_ready') and new.status='cancelled') or (old.status='out_for_delivery' and new.status='delivered')))) then raise exception using errcode='42501',message='TRANSITION_DENIED'; end if;
 new.updated_at=statement_timestamp();return new;
end $$;
revoke all on function public.neerva_direct_order_guard() from public,anon,authenticated;
create trigger direct_orders_guard before insert or update on public.direct_orders for each row execute function public.neerva_direct_order_guard();
-- Immutable status history; trigger writes in the same transaction. No direct client writes.
create table public.direct_order_events(id bigint generated always as identity primary key,order_id uuid not null references public.direct_orders(id) on delete restrict,status text not null,created_at timestamptz not null default now());
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
