-- Account-scoped ₹149 one-time studio unlocks. No static QR or self-reported UTR can confer access.
create table if not exists public.studio_paid_orders (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 product_code text not null check(product_code in ('home_studio','colour_studio')),
 amount_paise integer not null default 14900 check(amount_paise=14900),
 currency text not null default 'INR' check(currency='INR'),
 payment_method text not null default 'upi_manual' check(payment_method='upi_manual'),
 status text not null default 'requested' check(status in ('requested','verified','rejected','refunded')),
 reviewed_by uuid references auth.users(id), reviewed_at timestamptz, created_at timestamptz not null default now()
);
create unique index if not exists studio_one_pending_purchase on public.studio_paid_orders(user_id,product_code) where status='requested';
create index if not exists studio_order_status_idx on public.studio_paid_orders(status,created_at desc);
create table if not exists public.studio_payment_claims (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.studio_paid_orders(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 utr text not null unique check(utr ~ '^[A-Z0-9]{10,35}$'),
 reported_paid_at timestamptz not null,
 created_at timestamptz not null default now()
);
create table if not exists public.studio_paid_access (
 user_id uuid not null references auth.users(id) on delete cascade,
 product_code text not null check(product_code in ('home_studio','colour_studio')),
 order_id uuid not null unique references public.studio_paid_orders(id),
 granted_at timestamptz not null default now(),
 revoked_at timestamptz,
 primary key(user_id,product_code)
);
create table if not exists public.studio_payment_audit (
 id bigint generated always as identity primary key,
 order_id uuid not null references public.studio_paid_orders(id),
 actor_id uuid references auth.users(id),
 event text not null check(event in ('payment_verified','claim_rejected','refunded')),
 created_at timestamptz not null default now()
);
alter table public.studio_paid_orders enable row level security;
alter table public.studio_payment_claims enable row level security;
alter table public.studio_paid_access enable row level security;
alter table public.studio_payment_audit enable row level security;
revoke all on public.studio_paid_orders,public.studio_payment_claims,public.studio_paid_access,public.studio_payment_audit from anon,authenticated;
grant select,insert on public.studio_paid_orders to authenticated;
grant select,insert on public.studio_payment_claims to authenticated;
grant select on public.studio_paid_access to authenticated;
grant select on public.studio_payment_audit to authenticated;
-- Only admins may update original requests or grant access. No customer update privilege exists.
drop policy if exists studio_orders_read on public.studio_paid_orders;
create policy studio_orders_read on public.studio_paid_orders for select to authenticated
using(user_id=(select auth.uid()) or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
drop policy if exists studio_orders_create on public.studio_paid_orders;
create policy studio_orders_create on public.studio_paid_orders for insert to authenticated
with check(user_id=(select auth.uid()) and status='requested' and amount_paise=14900 and currency='INR' and payment_method='upi_manual');
drop policy if exists studio_claims_read on public.studio_payment_claims;
create policy studio_claims_read on public.studio_payment_claims for select to authenticated
using(user_id=(select auth.uid()) or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
drop policy if exists studio_claims_submit on public.studio_payment_claims;
create policy studio_claims_submit on public.studio_payment_claims for insert to authenticated
with check(user_id=(select auth.uid()) and exists(
 select 1 from public.studio_paid_orders o where o.id=order_id and o.user_id=(select auth.uid()) and o.status='requested'
));
drop policy if exists studio_access_read on public.studio_paid_access;
create policy studio_access_read on public.studio_paid_access for select to authenticated
using(user_id=(select auth.uid()) or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
drop policy if exists studio_audit_admin_read on public.studio_payment_audit;
create policy studio_audit_admin_read on public.studio_payment_audit for select to authenticated
using(public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
-- Admin-only atomic bank-reconciled decision. Grant no execute rights to anonymous callers.
create or replace function public.neerva_review_studio_payment(p_order_id uuid,p_action text)
returns text language plpgsql security definer
set search_path=pg_catalog,public,auth,pg_temp as $$
declare v_order public.studio_paid_orders%rowtype;
begin
 if (select auth.uid()) is null or not public.has_platform_role(array['admin','super_admin']::public.platform_role[]) then
  raise exception 'ADMIN_REQUIRED' using errcode='42501';
 end if;
 if p_action not in ('verified','rejected','refunded') then raise exception 'INVALID_ACTION' using errcode='22023'; end if;
 select * into v_order from public.studio_paid_orders where id=p_order_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if p_action in ('verified','rejected') then
  if v_order.status<>'requested' then raise exception 'INVALID_TRANSITION'; end if;
  if p_action='verified' and not exists(select 1 from public.studio_payment_claims where order_id=p_order_id) then
    raise exception 'CLAIM_REQUIRED';
  end if;
 elsif v_order.status<>'verified' then
  raise exception 'REFUND_REQUIRES_VERIFIED_ORDER';
 end if;
 update public.studio_paid_orders set status=p_action,reviewed_by=auth.uid(),reviewed_at=now() where id=p_order_id;
 if p_action='verified' then
  insert into public.studio_paid_access(user_id,product_code,order_id)
  values(v_order.user_id,v_order.product_code,p_order_id)
  on conflict(user_id,product_code) do update set order_id=excluded.order_id,granted_at=now(),revoked_at=null;
 elsif p_action='refunded' then
  update public.studio_paid_access set revoked_at=now()
  where user_id=v_order.user_id and product_code=v_order.product_code and order_id=p_order_id;
 end if;
 insert into public.studio_payment_audit(order_id,actor_id,event)
 values(p_order_id,auth.uid(),case p_action when 'verified' then 'payment_verified' when 'rejected' then 'claim_rejected' else 'refunded' end);
 return p_action;
end $$;
revoke all on function public.neerva_review_studio_payment(uuid,text) from public,anon,authenticated;
grant execute on function public.neerva_review_studio_payment(uuid,text) to authenticated;
comment on function public.neerva_review_studio_payment(uuid,text) is
 'Use only after independent bank statement verification; UTR and self-report cannot validate payment.';

-- Protected customer support ticket / refund request inbox (no photos of bank statements).
create table if not exists public.studio_support_tickets (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 order_id uuid references public.studio_paid_orders(id),
 issue text not null check(issue in ('payment_not_verified','duplicate_payment','refund_request','studio_access','other')),
 message text not null check(char_length(message) between 15 and 1000),
 status text not null default 'open' check(status in ('open','in_review','resolved')),
 admin_reply text check(admin_reply is null or char_length(admin_reply)<=1000),
 created_at timestamptz not null default now(),
 resolved_at timestamptz
);
create index if not exists studio_support_user_idx on public.studio_support_tickets(user_id,created_at desc);
create index if not exists studio_support_queue_idx on public.studio_support_tickets(status,created_at desc);
alter table public.studio_support_tickets enable row level security;
revoke all on public.studio_support_tickets from anon,authenticated;
grant select,insert,update on public.studio_support_tickets to authenticated;
drop policy if exists studio_support_read on public.studio_support_tickets;
create policy studio_support_read on public.studio_support_tickets for select to authenticated
using(user_id=auth.uid() or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
drop policy if exists studio_support_create on public.studio_support_tickets;
create policy studio_support_create on public.studio_support_tickets for insert to authenticated
with check(user_id=auth.uid() and status='open' and admin_reply is null and resolved_at is null
 and (order_id is null or exists(select 1 from public.studio_paid_orders o
      where o.id=order_id and o.user_id=auth.uid())));
drop policy if exists studio_support_admin_update on public.studio_support_tickets;
create policy studio_support_admin_update on public.studio_support_tickets for update to authenticated
using(public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
with check(public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
