-- Route procurement invitations, not accepted orders. Keep the existing admin
-- sourcing case as fallback. Exact approved coverage only; no customer address shared.
create function neerva_internal.auto_route_rfq() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.status<>'open' then return new;end if;
 insert into public.quote_invites(quote_request_id,tenant_id,status,invited_by)
 select new.id, eligible.tenant_id,'invited',null
 from (
  select distinct a.tenant_id
  from public.dealer_applications a
  join public.tenants t on t.id=a.tenant_id and t.status='active'
  join public.dealer_service_pincodes p on p.application_id=a.id and p.pincode=new.pincode
  join public.dealer_categories dc on dc.application_id=a.id
  join public.categories c on c.id=dc.category_id and c.slug=new.category_slug and c.status='published'
  where a.status='approved' and a.gstin_verification='verified'
    and a.owner_id<>new.requester_id
    and exists(select 1 from public.merchant_branches b where b.tenant_id=a.tenant_id and b.approved)
    and exists(select 1 from public.tenant_memberships m where m.tenant_id=a.tenant_id and m.user_id=a.owner_id and m.active and m.role='owner')
  order by a.tenant_id limit 5
 ) eligible
 on conflict(quote_request_id,tenant_id) do nothing;
 return new;
end;$$;
revoke all on function neerva_internal.auto_route_rfq() from public,anon,authenticated;
create trigger auto_route_verified_rfq after insert on public.quote_requests for each row execute function neerva_internal.auto_route_rfq();
