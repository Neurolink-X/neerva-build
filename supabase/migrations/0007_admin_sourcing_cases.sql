-- Admin-only nationwide sourcing desk for genuine customer quotation requests.
-- Zero fabricated orders or vendor offers: cases are created only after a real
-- verified RFQ is saved by the existing customer intake trigger.
create table if not exists public.admin_sourcing_cases (
 id uuid primary key default gen_random_uuid(),
 quote_request_id uuid not null unique references public.quote_requests(id) on delete cascade,
 status text not null default 'needs_dealer' check(status in ('needs_dealer','checking_suppliers','awaiting_customer','supplier_unavailable','closed_unserviceable')),
 scope text not null default 'local' check(scope in ('local','national')),
 note text not null default '' check(char_length(note)<=600),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists sourcing_cases_status_time_idx on public.admin_sourcing_cases(status,created_at desc);
alter table public.admin_sourcing_cases enable row level security;
revoke all on public.admin_sourcing_cases from anon,authenticated,public;
grant select on public.admin_sourcing_cases to authenticated;
grant update(status,scope,note) on public.admin_sourcing_cases to authenticated;
drop policy if exists sourcing_admin_select on public.admin_sourcing_cases;
create policy sourcing_admin_select on public.admin_sourcing_cases for select to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
drop policy if exists sourcing_admin_update on public.admin_sourcing_cases;
create policy sourcing_admin_update on public.admin_sourcing_cases for update to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

create or replace function public.neerva_new_sourcing_case()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,pg_temp as $$
begin
 insert into public.admin_sourcing_cases(quote_request_id)
 values (new.id) on conflict (quote_request_id) do nothing;
 return new;
end $$;
revoke all on function public.neerva_new_sourcing_case() from public,anon,authenticated;
drop trigger if exists create_admin_sourcing_case on public.quote_requests;
create trigger create_admin_sourcing_case after insert on public.quote_requests
for each row execute function public.neerva_new_sourcing_case();

create or replace function public.neerva_audit_sourcing_change()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,pg_temp as $$
begin
 if tg_op='UPDATE' then
  new.updated_at:=statement_timestamp();
  insert into public.audit_logs(actor_id,action,object_type,object_id,safe_metadata)
   values (auth.uid(),'admin_sourcing.updated','admin_sourcing_case',new.id::text,
    pg_catalog.jsonb_build_object('status_from',old.status,'status_to',new.status,'scope_to',new.scope));
 end if;
 return new;
end $$;
revoke all on function public.neerva_audit_sourcing_change() from public,anon,authenticated;
drop trigger if exists update_admin_sourcing_case on public.admin_sourcing_cases;
create trigger update_admin_sourcing_case before update on public.admin_sourcing_cases
for each row execute function public.neerva_audit_sourcing_change();

-- Retroactive, deduplicated: real older requests can also appear in admin queue.
insert into public.admin_sourcing_cases(quote_request_id)
select id from public.quote_requests
on conflict(quote_request_id) do nothing;

comment on table public.admin_sourcing_cases is
 'Administrative procurement follow-up only, not an order, seller offer, inventory commitment, invoice or delivery guarantee.';
