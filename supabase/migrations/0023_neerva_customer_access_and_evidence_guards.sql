-- Restored from existing production migration 20261124112442 neerva_customer_access_and_evidence_guards; local replay only, do not reapply to production.
create table public.account_access_restrictions(
 user_id uuid primary key references auth.users(id) on delete cascade,
 suspended boolean not null default false, reason text not null check(char_length(reason) between 10 and 500),
 updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);
alter table public.account_access_restrictions enable row level security;
grant select on public.account_access_restrictions to authenticated;
create policy account_restriction_read on public.account_access_restrictions for select to authenticated using(user_id=(select auth.uid()) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create function public.neerva_account_access_allowed() returns boolean language sql stable security invoker set search_path='' as $$select auth.uid() is not null and not exists(select 1 from public.account_access_restrictions where user_id=auth.uid() and suspended)$$;
revoke all on function public.neerva_account_access_allowed() from public,anon,authenticated;
grant execute on function public.neerva_account_access_allowed() to authenticated;
create function neerva_internal.set_account_access(p_user uuid,p_suspended boolean,p_reason text) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); old_state boolean; 
begin
 if actor is null or actor=p_user or not public.has_platform_role(array['super_admin']::public.platform_role[]) then raise exception 'Super administrator required' using errcode='42501'; end if;
 if p_suspended is null or p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then raise exception 'Valid reason required' using errcode='22023'; end if;
 perform 1 from auth.users where id=p_user for update;
 if not found then raise exception 'Account not found' using errcode='22023'; end if;
 if exists(select 1 from public.platform_role_grants where user_id=p_user and role not in ('customer','contractor')) or exists(select 1 from public.tenant_memberships where user_id=p_user and active) then raise exception 'Staff and dealer accounts require separate access review' using errcode='42501'; end if;
 select suspended into old_state from public.account_access_restrictions where user_id=p_user;
 if coalesce(old_state,false)=p_suspended then return false; end if;
 insert into public.account_access_restrictions(user_id,suspended,reason,updated_by) values(p_user,p_suspended,btrim(p_reason),actor)
 on conflict(user_id) do update set suspended=excluded.suspended,reason=excluded.reason,updated_by=actor,updated_at=now();
 insert into public.audit_logs(actor_id,action,object_type,object_id,safe_metadata) values(actor,case when p_suspended then 'account_suspend' else 'account_reactivate' end,'account',p_user::text,jsonb_build_object('reason',btrim(p_reason)));
 return true;
end;$$;
revoke all on function neerva_internal.set_account_access(uuid,boolean,text) from public,anon,authenticated;
grant execute on function neerva_internal.set_account_access(uuid,boolean,text) to authenticated;
create function public.neerva_admin_set_account_access(p_user uuid,p_suspended boolean,p_reason text) returns boolean language sql security invoker set search_path='' as $$select neerva_internal.set_account_access(p_user,p_suspended,p_reason)$$;
revoke all on function public.neerva_admin_set_account_access(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.neerva_admin_set_account_access(uuid,boolean,text) to authenticated;
-- Restrict customer writes even when they call PostgREST directly with an existing JWT.
do $$declare t text;begin
 foreach t in array array['quote_requests','orders','studio_customer_projects','studio_user_favourites','studio_paid_orders','studio_payment_claims','studio_support_tickets'] loop
 execute format('create policy account_active_insert on public.%I as restrictive for insert to authenticated with check ((select public.neerva_account_access_allowed()))',t);
 execute format('create policy account_active_update on public.%I as restrictive for update to authenticated using ((select public.neerva_account_access_allowed())) with check ((select public.neerva_account_access_allowed()))',t);
 execute format('create policy account_active_delete on public.%I as restrictive for delete to authenticated using ((select public.neerva_account_access_allowed()))',t);
 end loop;
end$$;
-- Guard checkout RPCs (security definer bypasses RLS) with the same active-account check.
do $$declare f record;definition text;begin
 for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('neerva_begin_studio_checkout','neerva_cancel_studio_checkout') loop
 definition:=pg_get_functiondef(f.oid);
 if position('if v_user is null then' in definition)=0 then raise exception 'Unexpected checkout implementation';end if;
 execute replace(definition,'if v_user is null then','if v_user is null or not public.neerva_account_access_allowed() then');
 end loop;
end$$;
-- A metadata row alone is not proof a KYC object exists.
create function neerva_internal.require_kyc_photo_object() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.review_status='verified' and old.review_status is distinct from 'verified' and not exists(select 1 from storage.objects where bucket_id='neerva-dealer-kyc' and name=new.storage_path) then raise exception 'Shop photo file is missing' using errcode='22023';end if;
 return new;
end;$$;
revoke all on function neerva_internal.require_kyc_photo_object() from public,anon,authenticated;
create trigger require_kyc_photo_object before update of review_status on public.dealer_shop_photos for each row execute function neerva_internal.require_kyc_photo_object();
