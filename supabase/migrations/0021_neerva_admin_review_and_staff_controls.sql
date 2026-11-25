-- Restored from existing production migration 20261124105459 neerva_admin_review_and_staff_controls; local replay only, do not reapply to production.
create or replace function neerva_internal.review_dealer(p_id uuid,p_expected text,p_action text,p_reason text)
returns text language plpgsql security definer set search_path='' as $$
declare a public.dealer_applications%rowtype; next_state text; actor uuid:=auth.uid();
begin
 if actor is null or not public.has_platform_role(array['admin','super_admin']::public.platform_role[]) then raise exception 'Administrator required' using errcode='42501'; end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then raise exception 'Review reason required' using errcode='22023'; end if;
 select * into a from public.dealer_applications where id=p_id for update;
 if not found or a.status is distinct from p_expected then raise exception 'Application changed; refresh' using errcode='40001'; end if;
 if a.owner_id=actor then raise exception 'Self-review is not allowed' using errcode='42501'; end if;
 if p_action='verify_gstin' and a.status='submitted' then
   update public.dealer_applications set gstin_verification='verified',reviewed_by=actor,reviewed_at=now(),decision_reason=btrim(p_reason),updated_at=now() where id=p_id;
   next_state:=a.status;
 elsif p_action='verify_photo' and a.status='submitted' then
   if not exists(select 1 from public.dealer_shop_photos where application_id=p_id and review_status='pending') then raise exception 'No pending shop photo records' using errcode='22023'; end if;
   update public.dealer_shop_photos set review_status='verified' where application_id=p_id and review_status='pending';
   next_state:=a.status;
 elsif p_action in ('approve','reactivate') and ((p_action='approve' and a.status='submitted') or (p_action='reactivate' and a.status='suspended')) then
   if a.gstin_verification<>'verified' or not exists(select 1 from public.dealer_shop_photos where application_id=p_id and review_status='verified') or exists(select 1 from public.dealer_shop_photos where application_id=p_id and review_status<>'verified') or not exists(select 1 from public.dealer_service_pincodes where application_id=p_id) or not exists(select 1 from public.dealer_categories where application_id=p_id) or not exists(select 1 from public.merchant_branches where tenant_id=a.tenant_id and approved) then raise exception 'Verified GST, shop photos, service pincodes, categories and approved branch are required' using errcode='22023'; end if;
   next_state:='approved';
   update public.tenants set status='active' where id=a.tenant_id and status in ('pending','suspended','active');
   if not found then raise exception 'Tenant is not eligible' using errcode='22023'; end if;
 elsif p_action='suspend' and a.status='approved' then
   next_state:='suspended'; update public.tenants set status='suspended' where id=a.tenant_id and status='active';
   if not found then raise exception 'Tenant is not active' using errcode='22023'; end if;
 elsif p_action='reject' and a.status='submitted' then next_state:='rejected';
 elsif p_action='request_changes' and a.status='submitted' then next_state:='changes_requested';
 else raise exception 'Invalid review transition' using errcode='22023';
 end if;
 if p_action not in ('verify_gstin','verify_photo') then
 update public.dealer_applications set status=next_state,reviewed_by=case when next_state='changes_requested' then null else actor end,reviewed_at=case when next_state='changes_requested' then null else now() end,gstin_verification=case when next_state='changes_requested' then 'unverified' else gstin_verification end,decision_reason=btrim(p_reason),updated_at=now() where id=p_id;
 end if;
 insert into public.dealer_review_events(application_id,reviewer_id,action,safe_note) values(p_id,actor,p_action,btrim(p_reason));
 return next_state;
end; $$;
revoke all on function neerva_internal.review_dealer(uuid,text,text,text) from public,anon,authenticated;
grant usage on schema neerva_internal to authenticated;
grant execute on function neerva_internal.review_dealer(uuid,text,text,text) to authenticated;
create or replace function public.neerva_admin_review_dealer(p_id uuid,p_expected text,p_action text,p_reason text) returns text language sql security invoker set search_path='' as $$select neerva_internal.review_dealer(p_id,p_expected,p_action,p_reason)$$;
revoke all on function public.neerva_admin_review_dealer(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.neerva_admin_review_dealer(uuid,text,text,text) to authenticated;
create or replace function neerva_internal.manage_staff_role(p_user uuid,p_role public.platform_role,p_action text,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); changed integer;
begin
 if actor is null or not public.has_platform_role(array['super_admin']::public.platform_role[]) or actor=p_user then raise exception 'Super administrator required; self-edit forbidden' using errcode='42501'; end if;
 if p_role not in ('support','finance','admin') or p_action not in ('grant','revoke') or p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then raise exception 'Invalid role request' using errcode='22023'; end if;
 if not exists(select 1 from auth.users where id=p_user and (email_confirmed_at is not null or phone_confirmed_at is not null)) then raise exception 'Verified account required' using errcode='22023'; end if;
 if p_action='grant' then insert into public.platform_role_grants(user_id,role,granted_by) values(p_user,p_role,actor) on conflict do nothing;
 else delete from public.platform_role_grants where user_id=p_user and role=p_role; end if;
 get diagnostics changed=row_count;
 if changed>0 then insert into public.audit_logs(actor_id,action,object_type,object_id,safe_metadata) values(actor,'role_'||p_action,'platform_role',p_user::text,jsonb_build_object('role',p_role,'reason',btrim(p_reason))); end if;
 return changed>0;
end; $$;
revoke all on function neerva_internal.manage_staff_role(uuid,public.platform_role,text,text) from public,anon,authenticated;
grant execute on function neerva_internal.manage_staff_role(uuid,public.platform_role,text,text) to authenticated;
create or replace function public.neerva_admin_manage_staff_role(p_user uuid,p_role public.platform_role,p_action text,p_reason text) returns boolean language sql security invoker set search_path='' as $$select neerva_internal.manage_staff_role(p_user,p_role,p_action,p_reason)$$;
revoke all on function public.neerva_admin_manage_staff_role(uuid,public.platform_role,text,text) from public,anon,authenticated;
grant execute on function public.neerva_admin_manage_staff_role(uuid,public.platform_role,text,text) to authenticated;
