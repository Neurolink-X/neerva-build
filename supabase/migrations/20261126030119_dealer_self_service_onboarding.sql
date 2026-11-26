-- Self-service dealer application: never grants active merchant access before review.
create function neerva_internal.save_dealer_application(p_name text,p_gstin text,p_city text,p_shop_pin text,p_pins text[],p_categories uuid[])
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); a public.dealer_applications%rowtype; tid uuid; aid uuid;
begin
 if actor is null or not public.neerva_account_access_allowed() or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null) then raise exception 'Verified email required' using errcode='42501'; end if;
 if p_name is null or char_length(btrim(p_name)) not between 3 and 160 or p_city is null or char_length(btrim(p_city)) not between 2 and 80 or p_gstin is null or p_gstin !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$' or p_shop_pin is null or p_shop_pin !~ '^[1-9][0-9]{5}$' or coalesce(cardinality(p_pins),0) not between 1 and 20 or coalesce(cardinality(p_categories),0) not between 1 and 20 or exists(select 1 from unnest(p_pins) as x(v) where v is null or v !~ '^[1-9][0-9]{5}$') or (select count(distinct v) from unnest(p_pins) as x(v))<>cardinality(p_pins) or not p_shop_pin=any(p_pins) or (select count(*) from public.categories where id=any(p_categories) and status='published')<>cardinality(p_categories) then raise exception 'Check business information, shop PIN, coverage and published categories' using errcode='22023'; end if;
 perform 1 from auth.users where id=actor for update;
 select * into a from public.dealer_applications where owner_id=actor for update;
 if found then
   if a.status not in ('draft','changes_requested') or not exists(select 1 from public.tenants where id=a.tenant_id and status='pending') then raise exception 'Application is not editable' using errcode='40001'; end if;
   tid:=a.tenant_id;aid:=a.id;
   update public.dealer_applications set legal_business_name=btrim(p_name),gstin=p_gstin,shop_city=btrim(p_city),updated_at=now() where id=aid;
   update public.tenants set business_name=btrim(p_name) where id=tid;
   update public.merchant_branches set name=btrim(p_name),city=btrim(p_city),pincode=p_shop_pin where tenant_id=tid and not approved;
   if not found then raise exception 'Pending branch unavailable' using errcode='22023'; end if;
 else
   if exists(select 1 from public.tenant_memberships where user_id=actor) then raise exception 'Existing dealer membership requires administrator assistance' using errcode='42501'; end if;
   insert into public.tenants(business_name,status) values(btrim(p_name),'pending') returning id into tid;
   insert into public.tenant_memberships(tenant_id,user_id,role,active) values(tid,actor,'owner',false);
   insert into public.merchant_branches(tenant_id,name,city,pincode,approved) values(tid,btrim(p_name),btrim(p_city),p_shop_pin,false);
   insert into public.dealer_applications(tenant_id,owner_id,legal_business_name,gstin,shop_city) values(tid,actor,btrim(p_name),p_gstin,btrim(p_city)) returning id into aid;
 end if;
 delete from public.dealer_service_pincodes where application_id=aid;
 insert into public.dealer_service_pincodes(application_id,pincode) select aid,v from unnest(p_pins) x(v);
 delete from public.dealer_categories where application_id=aid;
 insert into public.dealer_categories(application_id,category_id) select aid,v from unnest(p_categories) x(v);
 return aid;
end;$$;
revoke all on function neerva_internal.save_dealer_application(text,text,text,text,text[],uuid[]) from public,anon,authenticated;
grant execute on function neerva_internal.save_dealer_application(text,text,text,text,text[],uuid[]) to authenticated;
create function public.neerva_save_dealer_application(p_name text,p_gstin text,p_city text,p_shop_pin text,p_pins text[],p_categories uuid[])
returns uuid language sql security invoker set search_path='' as $$select neerva_internal.save_dealer_application(p_name,p_gstin,p_city,p_shop_pin,p_pins,p_categories)$$;
revoke all on function public.neerva_save_dealer_application(text,text,text,text,text[],uuid[]) from public,anon,authenticated;
grant execute on function public.neerva_save_dealer_application(text,text,text,text,text[],uuid[]) to authenticated;

create function neerva_internal.submit_dealer_application(p_id uuid) returns text language plpgsql security definer set search_path='' as $$
declare a public.dealer_applications%rowtype; actor uuid:=auth.uid();
begin
 if actor is null or not public.neerva_account_access_allowed() or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null) then raise exception 'Verified email required' using errcode='42501';end if;
 select * into a from public.dealer_applications where id=p_id and owner_id=actor for update;
 if not found then raise exception 'Application not available' using errcode='42501';end if;
 if a.status='submitted' then return a.status;end if;
 if a.status not in ('draft','changes_requested') then raise exception 'Application is not editable' using errcode='40001';end if;
 if not exists(select 1 from public.dealer_service_pincodes where application_id=p_id) or not exists(select 1 from public.dealer_categories where application_id=p_id) or not exists(select 1 from public.dealer_shop_photos p join storage.objects o on o.name=p.storage_path and o.bucket_id='neerva-dealer-kyc' where p.application_id=p_id and p.review_status in ('pending','verified')) then raise exception 'Add service PINs, categories and a private shop photograph' using errcode='22023';end if;
 update public.dealer_applications set status='submitted',submitted_at=now(),updated_at=now() where id=p_id;
 return 'submitted';
end;$$;
revoke all on function neerva_internal.submit_dealer_application(uuid) from public,anon,authenticated;
grant execute on function neerva_internal.submit_dealer_application(uuid) to authenticated;
create function public.neerva_submit_dealer_application(p_id uuid) returns text language sql security invoker set search_path='' as $$select neerva_internal.submit_dealer_application(p_id)$$;
revoke all on function public.neerva_submit_dealer_application(uuid) from public,anon,authenticated;
grant execute on function public.neerva_submit_dealer_application(uuid) to authenticated;

-- Only a verified administrator may approve the pending shop and owner.
-- Existing approval function still enforces KYC, branch, PIN, review and audit.
create function neerva_internal.review_self_service_dealer(p_id uuid,p_expected text,p_action text,p_reason text) returns text language plpgsql security definer set search_path='' as $$
declare a public.dealer_applications%rowtype; result text; actor uuid:=auth.uid();
begin
 if actor is null or not public.neerva_account_access_allowed() or not public.has_platform_role(array['admin','super_admin']::public.platform_role[]) then raise exception 'Administrator required' using errcode='42501';end if;
 select * into a from public.dealer_applications where id=p_id for update;
 if not found or a.status is distinct from p_expected then raise exception 'Application changed; refresh' using errcode='40001';end if;
 if a.owner_id=actor then raise exception 'Self-review is not allowed' using errcode='42501';end if;
 if p_action='approve' and a.status='submitted' and exists(select 1 from public.tenant_memberships where tenant_id=a.tenant_id and user_id=a.owner_id and role='owner' and not active) then
   update public.merchant_branches b set approved=true where b.tenant_id=a.tenant_id and exists(select 1 from public.dealer_service_pincodes p where p.application_id=a.id and p.pincode=b.pincode);
   result:=neerva_internal.review_dealer(p_id,p_expected,p_action,p_reason);
   update public.tenant_memberships set active=true where tenant_id=a.tenant_id and user_id=a.owner_id and role='owner';
   return result;
 end if;
 return neerva_internal.review_dealer(p_id,p_expected,p_action,p_reason);
end;$$;
revoke all on function neerva_internal.review_self_service_dealer(uuid,text,text,text) from public,anon,authenticated;
grant execute on function neerva_internal.review_self_service_dealer(uuid,text,text,text) to authenticated;
create or replace function public.neerva_admin_review_dealer(p_id uuid,p_expected text,p_action text,p_reason text) returns text language sql security invoker set search_path='' as $$select neerva_internal.review_self_service_dealer(p_id,p_expected,p_action,p_reason)$$;

-- Pending shop PIN is private until approved.
create policy branch_read_applicant on public.merchant_branches for select to authenticated using(exists(select 1 from public.dealer_applications a where a.tenant_id=merchant_branches.tenant_id and a.owner_id=(select auth.uid())));
