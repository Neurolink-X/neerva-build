-- Sanitized, aggregated diagnostics for the private admin operations console.
alter table public.system_incidents
  add column error_code text,
  add column route text,
  add column impact text,
  add column last_trace_id uuid,
  add column resolved_at timestamptz,
  add column resolved_by uuid references auth.users(id);

alter table public.system_incidents
  add constraint system_incidents_code_length check (error_code is null or char_length(error_code) <= 80),
  add constraint system_incidents_route_shape check (route is null or (route like '/%' and route not like '%?%' and char_length(route) <= 160)),
  add constraint system_incidents_impact_length check (impact is null or char_length(impact) <= 240);

-- A dealer cannot attach their pricing rule to another dealer's branch.
alter table public.merchant_branches
  add constraint merchant_branches_id_tenant_unique unique (id, tenant_id);
alter table public.pricing_rules
  add constraint pricing_branch_requires_tenant check (branch_id is null or tenant_id is not null),
  add constraint pricing_branch_tenant_fk foreign key (branch_id, tenant_id)
    references public.merchant_branches (id, tenant_id);

drop policy if exists quote_offer_insert_tenant on public.quote_offers;
create policy quote_offer_insert_tenant on public.quote_offers for insert to authenticated with check (
  created_by = auth.uid()
  and public.is_tenant_member(tenant_id, array['owner','manager','sales'])
  and exists (
    select 1 from public.quote_invites i
    where i.quote_request_id = quote_offers.quote_request_id
      and i.tenant_id = quote_offers.tenant_id
      and i.status in ('invited','viewed')
  )
);

create or replace function public.record_system_incident(
  p_incident_key text,
  p_module text,
  p_code text,
  p_severity text,
  p_safe_summary text,
  p_route text,
  p_impact text,
  p_trace_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_incident_key !~ '^[a-f0-9]{64}$'
    or p_module not in ('rfq')
    or p_code not in ('RFQ_RATE_LIMIT_UNAVAILABLE','RFQ_CAPTCHA_PROVIDER_FAILED','RFQ_CAPTCHA_REJECTED','RFQ_PERSISTENCE_FAILED','RFQ_IDEMPOTENCY_LOOKUP_FAILED')
    or p_severity not in ('info','warning','error','critical')
    or p_route not in ('/api/rfqs')
    or char_length(p_safe_summary) > 180
    or char_length(p_impact) > 240 then
    raise exception 'invalid incident payload' using errcode = '22023';
  end if;

  insert into public.system_incidents (
    incident_key, module, severity, safe_summary, occurrence_count,
    first_seen_at, last_seen_at, status, error_code, route, impact, last_trace_id
  ) values (
    p_incident_key, p_module, p_severity, p_safe_summary, 1,
    now(), now(), 'open', p_code, p_route, p_impact, p_trace_id
  )
  on conflict (incident_key) do update set
    severity = excluded.severity,
    safe_summary = excluded.safe_summary,
    occurrence_count = public.system_incidents.occurrence_count + 1,
    last_seen_at = now(),
    status = case when public.system_incidents.status = 'resolved' then 'open' else public.system_incidents.status end,
    error_code = excluded.error_code,
    route = excluded.route,
    impact = excluded.impact,
    last_trace_id = excluded.last_trace_id,
    resolved_at = case when public.system_incidents.status = 'resolved' then null else public.system_incidents.resolved_at end,
    resolved_by = case when public.system_incidents.status = 'resolved' then null else public.system_incidents.resolved_by end;
end;
$$;

revoke all on function public.record_system_incident(text,text,text,text,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.record_system_incident(text,text,text,text,text,text,text,uuid) to service_role;

comment on function public.record_system_incident(text,text,text,text,text,text,text,uuid) is
  'Service-role-only, allowlisted incident aggregation. Do not pass request payloads, phone numbers, payment data, or raw exception text.';
