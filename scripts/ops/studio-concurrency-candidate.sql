-- CANDIDATE ONLY: apply through the disposable rehearsal script, not production.
-- Generate a tracked Supabase migration after staging verification and review.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
-- Refuse to mask existing inconsistencies; operator reconciliation is required.
do $$begin
 if exists(select 1 from public.studio_payment_claims c join public.studio_paid_orders o on o.id=c.order_id where o.status='cancelled' or o.user_id<>c.user_id) then
  raise exception 'EXISTING_CLAIM_RECONCILIATION_REQUIRED';
 end if;
 if exists(select 1 from public.studio_paid_access a join public.studio_paid_orders o on o.id=a.order_id where a.revoked_at is null and (o.status<>'verified' or o.user_id<>a.user_id or o.product_code<>a.product_code))
 or exists(select 1 from public.studio_paid_orders o where o.status='verified' and not exists(select 1 from public.studio_paid_access a where a.order_id=o.id and a.user_id=o.user_id and a.product_code=o.product_code and a.revoked_at is null)) then
  raise exception 'EXISTING_ENTITLEMENT_RECONCILIATION_REQUIRED';
 end if;
end$$;
-- Internal trigger needs owner privilege for row locking; no public execute grant.
create or replace function neerva_internal.guard_studio_claim()
returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();order_row public.studio_paid_orders%rowtype;
begin
 if actor is null or new.user_id is distinct from actor or not public.neerva_account_access_allowed() then
  raise exception 'CLAIM_ACCESS_DENIED' using errcode='42501';
 end if;
 select * into order_row from public.studio_paid_orders where id=new.order_id and user_id=actor for update;
 if not found or order_row.status<>'requested' then raise exception 'CLAIM_ORDER_NOT_PENDING' using errcode='23514';end if;
 if new.reported_paid_at is null or new.reported_paid_at>statement_timestamp()+interval '5 minutes' or new.reported_paid_at<statement_timestamp()-interval '30 days' then
  raise exception 'INVALID_CLAIM_TIMESTAMP' using errcode='23514';
 end if;
 return new;
end$$;
revoke all on function neerva_internal.guard_studio_claim() from public,anon,authenticated;
drop trigger if exists neerva_studio_claim_lock on public.studio_payment_claims;
create trigger neerva_studio_claim_lock before insert on public.studio_payment_claims for each row execute function neerva_internal.guard_studio_claim();
create or replace function public.neerva_begin_studio_checkout(p_product text)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,public,auth,pg_temp as $$
declare v_user uuid:=auth.uid();v_config public.studio_feature_settings%rowtype;v_order public.studio_paid_orders%rowtype;
begin
 if v_user is null or not public.neerva_account_access_allowed() then raise exception 'AUTH_REQUIRED' using errcode='42501';end if;
 if p_product is null or p_product not in ('home_studio','colour_studio') then raise exception 'BAD_PRODUCT';end if;
 perform pg_advisory_xact_lock(hashtextextended('neerva:studio:'||v_user::text||':'||p_product,0));
 select * into v_config from public.studio_feature_settings where product_code=p_product for share;
 if not found or v_config.access_mode<>'paid' or not v_config.is_published or not v_config.checkout_enabled then
  raise exception 'CHECKOUT_DISABLED' using errcode='42501';
 end if;
 if exists(select 1 from public.studio_paid_access
   where user_id=v_user and product_code=p_product and revoked_at is null) then
  raise exception 'ALREADY_OWNED';
 end if;
 select * into v_order from public.studio_paid_orders
 where user_id=v_user and product_code=p_product and status='requested'
 order by created_at desc limit 1;
 if not found then
  insert into public.studio_paid_orders(user_id,product_code,amount_paise)
  values(v_user,p_product,v_config.price_paise)
  on conflict(user_id,product_code) where status='requested' do nothing
  returning * into v_order;
  if not found then
   select * into v_order from public.studio_paid_orders
    where user_id=v_user and product_code=p_product and status='requested' limit 1;
  end if;
 end if;
 return jsonb_build_object('orderId',v_order.id,'pricePaise',v_order.amount_paise,'status','requested');
end $$;
create or replace function public.neerva_cancel_studio_checkout(p_order uuid)
returns boolean language plpgsql security definer
set search_path=pg_catalog,public,auth,pg_temp as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null or not public.neerva_account_access_allowed() then raise exception 'AUTH_REQUIRED' using errcode='42501';end if;
 -- Lock first, then check claims in a fresh READ COMMITTED statement.
 perform 1 from public.studio_paid_orders where id=p_order and user_id=v_user and status='requested' for update;
 if not found then return false;end if;
 update public.studio_paid_orders set status='cancelled'
 where id=p_order and user_id=v_user and status='requested'
 and not exists(select 1 from public.studio_payment_claims where order_id=p_order);
 return found;
end $$;
create or replace function public.neerva_review_studio_payment(p_order_id uuid,p_action text)
returns text language plpgsql security definer
set search_path=pg_catalog,public,auth,pg_temp as $$
declare v_order public.studio_paid_orders%rowtype;
begin
 if (select auth.uid()) is null or not public.neerva_account_access_allowed() or not public.has_platform_role(array['admin','super_admin']::public.platform_role[]) then
  raise exception 'ADMIN_REQUIRED' using errcode='42501';
 end if;
 if p_action is null or p_action not in ('verified','rejected','refunded') then raise exception 'INVALID_ACTION' using errcode='22023'; end if;
 select * into v_order from public.studio_paid_orders where id=p_order_id;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 -- Same per-account/product lock as checkout, then acquire order row lock.
 perform pg_advisory_xact_lock(hashtextextended('neerva:studio:'||v_order.user_id::text||':'||v_order.product_code,0));
 select * into v_order from public.studio_paid_orders where id=p_order_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if p_action in ('verified','rejected') then
  if v_order.status<>'requested' then raise exception 'INVALID_TRANSITION'; end if;
  if p_action='verified' and exists(select 1 from public.studio_paid_access where user_id=v_order.user_id and product_code=v_order.product_code and revoked_at is null) then raise exception 'ALREADY_OWNED';end if;
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
  where user_id=v_order.user_id and product_code=v_order.product_code and order_id=p_order_id and revoked_at is null;
  if not found then raise exception 'ENTITLEMENT_RECONCILIATION_REQUIRED';end if;
 end if;
 insert into public.studio_payment_audit(order_id,actor_id,event)
 values(p_order_id,auth.uid(),case p_action when 'verified' then 'payment_verified' when 'rejected' then 'claim_rejected' else 'refunded' end);
 return p_action;
end $$;
revoke all on function public.neerva_begin_studio_checkout(text), public.neerva_cancel_studio_checkout(uuid), public.neerva_review_studio_payment(uuid,text) from public,anon,authenticated;
grant execute on function public.neerva_begin_studio_checkout(text), public.neerva_cancel_studio_checkout(uuid), public.neerva_review_studio_payment(uuid,text) to authenticated;
commit;
