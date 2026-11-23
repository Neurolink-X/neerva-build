-- Authenticated, email-verified, RLS-isolated quote intake. No paid Redis or CAPTCHA.
-- Works only for explicitly signed-in users; never impersonate a quote or a dealer.
create policy quote_request_submit_owned
on public.quote_requests for insert to authenticated
with check (requester_id = (select auth.uid()));

-- Column allowlist: callers cannot set status, creation time or arbitrary ID.
revoke insert, update, delete on public.quote_requests from anon, authenticated, public;
grant select on public.quote_requests to authenticated;
grant insert (idempotency_key, requester_id, category_slug, material_description,
 quantity, unit, city, pincode, requested_date, contact_name, phone)
 on public.quote_requests to authenticated;

create or replace function public.enforce_customer_rfq_intake()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare recent_count integer;
begin
  if auth.uid() is null or new.requester_id is distinct from auth.uid() then
    raise exception using errcode='42501', message='RFQ_AUTH_REQUIRED';
  end if;
  if not exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
  ) then
    raise exception using errcode='P0001', message='RFQ_EMAIL_VERIFICATION_REQUIRED';
  end if;
  new.created_at := statement_timestamp();
  new.status := 'open'::public.rfq_status;

  -- Serialize per-user inserts to avoid racing a per-user rate limit.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.requester_id::text, 29172));

  -- Retries with the exact same key are allowed to reach the unique constraint.
  -- API returns the original request instead of inventing a second confirmation.
  if exists (
    select 1 from public.quote_requests q
    where q.requester_id = new.requester_id and q.idempotency_key = new.idempotency_key
  ) then
    return new;
  end if;

  select count(*) into recent_count
  from public.quote_requests q
  where q.requester_id = new.requester_id
    and q.created_at > statement_timestamp() - interval '1 hour';
  if recent_count >= 5 then
    raise exception using errcode='P0001', message='RFQ_RATE_LIMITED';
  end if;
  if exists (
    select 1 from public.quote_requests q
    where q.requester_id = new.requester_id
      and q.created_at > statement_timestamp() - interval '60 seconds'
  ) then
    raise exception using errcode='P0001', message='RFQ_RATE_LIMITED';
  end if;
  return new;
end $$;

revoke all on function public.enforce_customer_rfq_intake() from public, anon, authenticated;

drop trigger if exists customer_rfq_validate_insert on public.quote_requests;
create trigger customer_rfq_validate_insert
before insert on public.quote_requests
for each row execute function public.enforce_customer_rfq_intake();

create or replace function public.audit_customer_rfq_insert()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
 insert into public.audit_logs(actor_id, tenant_id, action, object_type, object_id, safe_metadata)
 values (new.requester_id, null, 'rfq.created', 'quote_request', new.id::text,
         pg_catalog.jsonb_build_object('category', new.category_slug));
 return new;
end $$;
revoke all on function public.audit_customer_rfq_insert() from public, anon, authenticated;

drop trigger if exists customer_rfq_record_audit on public.quote_requests;
create trigger customer_rfq_record_audit
after insert on public.quote_requests
for each row execute function public.audit_customer_rfq_insert();

create index if not exists quote_requester_recent_idx
on public.quote_requests(requester_id, created_at desc);
