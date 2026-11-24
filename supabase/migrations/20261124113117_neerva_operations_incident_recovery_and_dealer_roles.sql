create table neerva_internal.incident_report_budget(user_id uuid primary key references auth.users(id) on delete cascade, window_start timestamptz not null, hits integer not null);
revoke all on neerva_internal.incident_report_budget from public,anon,authenticated;
create function neerva_internal.report_client_incident(p_area text,p_code text) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); n integer; k text; route_name text; summary text;
begin
 if actor is null or not public.neerva_account_access_allowed() then return false;end if;
 if p_area not in ('account','admin','dealer','customer','catalog','studio','payments','platform') or p_code not in ('API_5XX','NETWORK_FAILURE','UI_EXCEPTION','AUTH_SERVICE_FAILURE') then raise exception 'Invalid incident category' using errcode='22023';end if;
 insert into neerva_internal.incident_report_budget as b(user_id,window_start,hits) values(actor,now(),1)
 on conflict(user_id) do update set window_start=case when b.window_start<now()-interval '1 minute' then now() else b.window_start end,hits=case when b.window_start<now()-interval '1 minute' then 1 else least(b.hits+1,13) end returning hits into n;
 if n>12 then return false;end if;
 route_name:=case p_area when 'account' then '/account' when 'admin' then '/admin' when 'dealer' then '/dealer/dashboard' when 'customer' then '/account' when 'catalog' then '/materials' when 'studio' then '/design-studio' when 'payments' then '/studio-pricing' else '/' end;
 summary:=case p_code when 'API_5XX' then 'Client observed an unsuccessful server response.' when 'NETWORK_FAILURE' then 'Client could not reach a platform request.' when 'UI_EXCEPTION' then 'Client reported an unexpected interface error.' else 'Client observed an authentication service failure.' end;
 k:=encode(sha256(convert_to('client-v1:'||p_area||':'||p_code,'UTF8')),'hex');
 insert into public.system_incidents(incident_key,module,severity,error_code,route,safe_summary,impact,status,occurrence_count,first_seen_at,last_seen_at)
 values(k,p_area,'warning',p_code,route_name,summary,'Client-reported signal; investigate before declaring a server outage.','open',1,now(),now())
 on conflict(incident_key) do update set occurrence_count=public.system_incidents.occurrence_count+1,last_seen_at=now(),status=case when public.system_incidents.status='resolved' then 'open' else public.system_incidents.status end,resolved_at=case when public.system_incidents.status='resolved' then null else public.system_incidents.resolved_at end,resolved_by=case when public.system_incidents.status='resolved' then null else public.system_incidents.resolved_by end;
 return true;
end;$$;
revoke all on function neerva_internal.report_client_incident(text,text) from public,anon,authenticated;
grant execute on function neerva_internal.report_client_incident(text,text) to authenticated;
create function public.neerva_report_client_incident(p_area text,p_code text) returns boolean language sql security invoker set search_path='' as $$select neerva_internal.report_client_incident(p_area,p_code)$$;
revoke all on function public.neerva_report_client_incident(text,text) from public,anon,authenticated;
grant execute on function public.neerva_report_client_incident(text,text) to authenticated;
create function neerva_internal.review_incident(p_id uuid,p_expected text,p_status text,p_note text) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not public.has_platform_role(array['admin','super_admin']::public.platform_role[]) then raise exception 'Admin required' using errcode='42501';end if;
 if p_status not in ('open','investigating','resolved','ignored') or p_note is null or char_length(btrim(p_note)) not between 10 and 500 then raise exception 'Valid status and reason required' using errcode='22023';end if;
 update public.system_incidents set status=p_status,resolved_at=case when p_status='resolved' then now() else null end,resolved_by=case when p_status='resolved' then actor else null end where id=p_id and status=p_expected;
 if not found then raise exception 'Incident changed, refresh' using errcode='40001';end if;
 insert into public.audit_logs(actor_id,action,object_type,object_id,safe_metadata) values(actor,'incident_review','incident',p_id::text,jsonb_build_object('status',p_status,'reason',btrim(p_note)));
 return true;
end;$$;
revoke all on function neerva_internal.review_incident(uuid,text,text,text) from public,anon,authenticated;
grant execute on function neerva_internal.review_incident(uuid,text,text,text) to authenticated;
create function public.neerva_admin_review_incident(p_id uuid,p_expected text,p_status text,p_note text) returns boolean language sql security invoker set search_path='' as $$select neerva_internal.review_incident(p_id,p_expected,p_status,p_note)$$;
revoke all on function public.neerva_admin_review_incident(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.neerva_admin_review_incident(uuid,text,text,text) to authenticated;
create function neerva_internal.account_diagnostic(p_user uuid,p_note text) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); u auth.users%rowtype; result jsonb;
begin
 if actor is null or not public.has_platform_role(array['admin','super_admin']::public.platform_role[]) then raise exception 'Admin required' using errcode='42501';end if;
 if p_note is null or char_length(btrim(p_note)) not between 10 and 500 then raise exception 'Support case reason required' using errcode='22023';end if;
 select * into u from auth.users where id=p_user;
 if not found then raise exception 'Account not found' using errcode='22023';end if;
 result:=jsonb_build_object('userId',u.id,'email',u.email,'emailVerified',u.email_confirmed_at is not null,'phoneVerified',u.phone_confirmed_at is not null,'lastSignIn',u.last_sign_in_at,'authBanned',coalesce(u.banned_until>now(),false),'profileExists',exists(select 1 from public.profiles where id=p_user),'restricted',exists(select 1 from public.account_access_restrictions where user_id=p_user and suspended),'roles',(select coalesce(jsonb_agg(role),'[]'::jsonb) from public.platform_role_grants where user_id=p_user),'dealerMemberships',(select coalesce(jsonb_agg(jsonb_build_object('tenantId',m.tenant_id,'role',m.role,'active',m.active,'tenantStatus',t.status)),'[]'::jsonb) from public.tenant_memberships m join public.tenants t on t.id=m.tenant_id where m.user_id=p_user));
 insert into public.audit_logs(actor_id,action,object_type,object_id,safe_metadata) values(actor,'account_diagnostic','account',p_user::text,jsonb_build_object('reason',btrim(p_note)));
 return result;
end;$$;
revoke all on function neerva_internal.account_diagnostic(uuid,text) from public,anon,authenticated;
grant execute on function neerva_internal.account_diagnostic(uuid,text) to authenticated;
create function public.neerva_admin_account_diagnostic(p_user uuid,p_note text) returns jsonb language sql security invoker set search_path='' as $$select neerva_internal.account_diagnostic(p_user,p_note)$$;
revoke all on function public.neerva_admin_account_diagnostic(uuid,text) from public,anon,authenticated;
grant execute on function public.neerva_admin_account_diagnostic(uuid,text) to authenticated;
create function neerva_internal.manage_dealer_member(p_tenant uuid,p_user uuid,p_role text,p_active boolean,p_reason text) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); existing public.tenant_memberships%rowtype;
begin
 if actor is null or actor=p_user or not public.has_platform_role(array['super_admin']::public.platform_role[]) then raise exception 'Super administrator required' using errcode='42501';end if;
 if p_role not in ('manager','sales','inventory','dispatch','accounts') or p_active is null or p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then raise exception 'Valid staff role and reason required' using errcode='22023';end if;
 perform 1 from public.tenants where id=p_tenant and status='active' for update;
 if not found then raise exception 'Active dealer required' using errcode='22023';end if;
 perform 1 from auth.users where id=p_user and (email_confirmed_at is not null or phone_confirmed_at is not null) for update;
 if not found then raise exception 'Verified account required' using errcode='22023';end if;
 if exists(select 1 from public.platform_role_grants where user_id=p_user and role in ('admin','super_admin','support','finance')) or exists(select 1 from public.account_access_restrictions where user_id=p_user and suspended) then raise exception 'Conflicting account access' using errcode='42501';end if;
 select * into existing from public.tenant_memberships where tenant_id=p_tenant and user_id=p_user for update;
 if existing.role='owner' then raise exception 'Owner membership is protected' using errcode='42501';end if;
 if not found and not p_active then return false;end if;
 insert into public.tenant_memberships(tenant_id,user_id,role,active) values(p_tenant,p_user,p_role,p_active) on conflict(tenant_id,user_id) do update set role=excluded.role,active=excluded.active;
 insert into public.audit_logs(actor_id,tenant_id,action,object_type,object_id,safe_metadata) values(actor,p_tenant,'dealer_member_change','account',p_user::text,jsonb_build_object('role',p_role,'active',p_active,'reason',btrim(p_reason)));
 return true;
end;$$;
revoke all on function neerva_internal.manage_dealer_member(uuid,uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function neerva_internal.manage_dealer_member(uuid,uuid,text,boolean,text) to authenticated;
create function public.neerva_admin_manage_dealer_member(p_tenant uuid,p_user uuid,p_role text,p_active boolean,p_reason text) returns boolean language sql security invoker set search_path='' as $$select neerva_internal.manage_dealer_member(p_tenant,p_user,p_role,p_active,p_reason)$$;
revoke all on function public.neerva_admin_manage_dealer_member(uuid,uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.neerva_admin_manage_dealer_member(uuid,uuid,text,boolean,text) to authenticated;
