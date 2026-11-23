-- Consent proof is set by the server-side database trigger, never from client timestamps.
alter table public.quote_requests
 add column if not exists consent_version text,
 add column if not exists consented_at timestamptz;
create or replace function public.record_customer_rfq_consent()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,pg_temp
as $$
begin
 new.consent_version:='rfq_privacy_v1_2026_11_23';
 new.consented_at:=statement_timestamp();
 return new;
end $$;
revoke all on function public.record_customer_rfq_consent() from public,anon,authenticated;
drop trigger if exists customer_rfq_record_consent on public.quote_requests;
create trigger customer_rfq_record_consent before insert on public.quote_requests
for each row execute function public.record_customer_rfq_consent();
revoke update (consent_version,consented_at) on public.quote_requests from anon,authenticated;
