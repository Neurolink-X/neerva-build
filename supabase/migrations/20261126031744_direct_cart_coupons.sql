-- Coupons are reserved only against a reviewed bill, never against client prices.
create table public.checkout_coupons (
 code text primary key check(code ~ '^[A-Z0-9-]{3,24}$'),
 fixed_paise bigint not null default 0 check(fixed_paise between 0 and 10000000),
 rate_bps integer not null default 0 check(rate_bps between 0 and 10000),
 cap_paise bigint not null check(cap_paise between 1 and 10000000),
 minimum_paise bigint not null default 0 check(minimum_paise between 0 and 5000000000),
 starts_at timestamptz not null, ends_at timestamptz not null,
 max_uses integer not null check(max_uses between 1 and 100000),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 check(ends_at>starts_at),check(fixed_paise>0 or rate_bps>0)
);
alter table public.checkout_coupons enable row level security;
revoke all on public.checkout_coupons from public,anon,authenticated;
grant select,insert on public.checkout_coupons to authenticated;
grant update(active) on public.checkout_coupons to authenticated;
create policy coupon_admin_read on public.checkout_coupons for select to authenticated using((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy coupon_admin_create on public.checkout_coupons for insert to authenticated with check((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy coupon_admin_disable on public.checkout_coupons for update to authenticated using((select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))) with check((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create table neerva_internal.checkout_coupon_uses (
 order_id uuid primary key references public.direct_orders(id),
 code text not null references public.checkout_coupons(code),
 customer_id uuid not null references auth.users(id),
 discount_paise bigint not null check(discount_paise>0),
 state text not null check(state in ('reserved','redeemed','released')),
 created_at timestamptz not null default now()
);
alter table neerva_internal.checkout_coupon_uses enable row level security;
revoke all on neerva_internal.checkout_coupon_uses from public,anon,authenticated;
create index checkout_coupon_usage on neerva_internal.checkout_coupon_uses(code,customer_id,state);
alter table public.direct_orders add column coupon_code text check(coupon_code ~ '^[A-Z0-9-]{3,24}$'),add column coupon_status text check(coupon_status in ('requested','applied','unavailable','not_better'));
grant insert(coupon_code),select(coupon_code,coupon_status) on public.direct_orders to authenticated;
create function neerva_internal.coupon_available(p_code text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare c public.checkout_coupons%rowtype; actor uuid:=auth.uid();
begin
 if actor is null or not public.neerva_account_access_allowed() then return false;end if;
 select * into c from public.checkout_coupons where code=p_code and active and starts_at<=now() and ends_at>now();
 if not found then return false;end if;
 return (select count(*) from neerva_internal.checkout_coupon_uses u where u.code=c.code and u.state<>'released')<c.max_uses
 and not exists(select 1 from neerva_internal.checkout_coupon_uses u where u.code=c.code and u.customer_id=actor and u.state<>'released');
end;$$;
revoke all on function neerva_internal.coupon_available(text) from public,anon,authenticated;
grant execute on function neerva_internal.coupon_available(text) to authenticated;
create function public.neerva_coupon_available(p_code text) returns boolean language sql stable security invoker set search_path='' as $$select neerva_internal.coupon_available(p_code)$$;
revoke all on function public.neerva_coupon_available(text) from public,anon,authenticated;
grant execute on function public.neerva_coupon_available(text) to authenticated;
create function neerva_internal.apply_direct_coupon() returns trigger language plpgsql security definer set search_path='' as $$
declare c public.checkout_coupons%rowtype; amount bigint;
begin
 if tg_op='INSERT' then
  if new.coupon_code is not null then
   if not exists(select 1 from public.direct_orders o where o.customer_id=new.customer_id and o.idempotency_key=new.idempotency_key and o.coupon_code=new.coupon_code) and not neerva_internal.coupon_available(new.coupon_code) then raise exception 'COUPON_UNAVAILABLE' using errcode='22023';end if;
   new.coupon_status:='requested';
  end if;
  return new;
 end if;
 if new.coupon_code is distinct from old.coupon_code then raise exception 'COUPON_IMMUTABLE' using errcode='42501';end if;
 if new.coupon_code is null then return new;end if;
 if new.status='price_ready' and old.status in ('received','sourcing') then
  select * into c from public.checkout_coupons where code=new.coupon_code for update;
  if not found or not c.active or c.starts_at>now() or c.ends_at<=now() or new.material_paise<c.minimum_paise or
   (select count(*) from neerva_internal.checkout_coupon_uses u where u.code=c.code and u.state<>'released')>=c.max_uses or
   exists(select 1 from neerva_internal.checkout_coupon_uses u where u.code=c.code and u.customer_id=new.customer_id and u.state<>'released') then
   new.coupon_status:='unavailable';return new;
  end if;
  amount:=least(c.cap_paise,new.material_paise-1,c.fixed_paise+round(new.material_paise*c.rate_bps/10000.0)::bigint);
  if amount<=new.discount_paise then new.coupon_status:='not_better';return new;end if;
  insert into neerva_internal.checkout_coupon_uses(order_id,code,customer_id,discount_paise,state) values(new.id,c.code,new.customer_id,amount,'reserved');
  new.total_paise:=new.total_paise+new.discount_paise-amount;
  new.discount_paise:=amount;new.coupon_status:='applied';
 elsif new.status='confirmed' and old.status='price_ready' then
  update neerva_internal.checkout_coupon_uses set state='redeemed' where order_id=new.id and state='reserved';
 elsif new.status='cancelled' and old.status in ('received','sourcing','price_ready') then
  update neerva_internal.checkout_coupon_uses set state='released' where order_id=new.id and state='reserved';
 end if;
 return new;
end;$$;
revoke all on function neerva_internal.apply_direct_coupon() from public,anon,authenticated;
-- Alphabetically after direct_orders_guard: it has already calculated the trusted base bill.
create trigger zz_direct_coupon before insert or update on public.direct_orders for each row execute function neerva_internal.apply_direct_coupon();
